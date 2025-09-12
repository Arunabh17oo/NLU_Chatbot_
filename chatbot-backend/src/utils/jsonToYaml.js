import yaml from 'js-yaml';
import fs from 'fs-extra';
import path from 'path';

/**
 * Converts JSON training data to YAML format for HuggingFace training
 * @param {Array} jsonData - Array of training examples
 * @param {string} outputPath - Path to save the YAML file
 * @returns {Promise<string>} - Path to the created YAML file
 */
export const convertJsonToYaml = async (jsonData, outputPath) => {
  try {
    // Validate input data
    if (!Array.isArray(jsonData) || jsonData.length === 0) {
      throw new Error('Invalid JSON data: Must be a non-empty array');
    }

    // Transform JSON data to HuggingFace format
    const transformedData = jsonData.map((item, index) => {
      // Extract text and intent from various possible field names
      const text = item.text || item.Text || item.utterance || item.Utterance || item.message || item.Message || '';
      const intent = item.intent || item.Intent || item.label || item.Label || item.class || item.Class || '';

      if (!text || !intent) {
        console.warn(`Skipping item ${index}: Missing text or intent field`);
        return null;
      }

      return {
        text: text.trim(),
        label: intent.trim()
      };
    }).filter(Boolean); // Remove null entries

    if (transformedData.length === 0) {
      throw new Error('No valid training examples found in JSON data');
    }

    // Create YAML structure for HuggingFace
    const yamlData = {
      version: '1.0',
      data: {
        training: transformedData,
        validation: transformedData.slice(0, Math.max(1, Math.floor(transformedData.length * 0.2))), // 20% for validation
        test: transformedData.slice(0, Math.max(1, Math.floor(transformedData.length * 0.1))) // 10% for testing
      },
      metadata: {
        total_examples: transformedData.length,
        intents: [...new Set(transformedData.map(item => item.label))],
        created_at: new Date().toISOString()
      }
    };

    // Ensure output directory exists
    await fs.ensureDir(path.dirname(outputPath));

    // Write YAML file
    const yamlContent = yaml.dump(yamlData, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false
    });

    await fs.writeFile(outputPath, yamlContent, 'utf8');

    console.log(`✅ Successfully converted JSON to YAML: ${outputPath}`);
    console.log(`📊 Total examples: ${transformedData.length}`);
    console.log(`🎯 Unique intents: ${yamlData.metadata.intents.length}`);

    return outputPath;
  } catch (error) {
    console.error('❌ Error converting JSON to YAML:', error.message);
    throw error;
  }
};

/**
 * Validates JSON training data structure
 * @param {Array} jsonData - Array of training examples
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateTrainingData = (jsonData) => {
  const errors = [];
  
  if (!Array.isArray(jsonData)) {
    errors.push('Data must be an array');
    return { isValid: false, errors };
  }

  if (jsonData.length === 0) {
    errors.push('Data array cannot be empty');
    return { isValid: false, errors };
  }

  const validFields = ['text', 'Text', 'utterance', 'Utterance', 'message', 'Message'];
  const intentFields = ['intent', 'Intent', 'label', 'Label', 'class', 'Class'];

  jsonData.forEach((item, index) => {
    if (typeof item !== 'object' || item === null) {
      errors.push(`Item ${index}: Must be an object`);
      return;
    }

    const hasText = validFields.some(field => item[field] && typeof item[field] === 'string');
    const hasIntent = intentFields.some(field => item[field] && typeof item[field] === 'string');

    if (!hasText) {
      errors.push(`Item ${index}: Missing text field (expected one of: ${validFields.join(', ')})`);
    }

    if (!hasIntent) {
      errors.push(`Item ${index}: Missing intent field (expected one of: ${intentFields.join(', ')})`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    stats: {
      totalItems: jsonData.length,
      validItems: jsonData.filter(item => {
        const hasText = validFields.some(field => item[field] && typeof item[field] === 'string');
        const hasIntent = intentFields.some(field => item[field] && typeof item[field] === 'string');
        return hasText && hasIntent;
      }).length
    }
  };
};
