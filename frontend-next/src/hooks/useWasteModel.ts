import { useState, useEffect, useCallback, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';

/**
 * useWasteModel — Custom-trained waste classification model (Truth Mode)
 *
 * WHY THIS REPLACES useMobileNet:
 * ────────────────────────────────
 * useMobileNet loaded a GENERIC model trained on ImageNet (1000 classes:
 * "golden retriever", "sports car", "pizza", etc.). It knows NOTHING
 * about waste categories. Every "correct" scan was pure luck + a massive
 * ALLOWED_WASTE_ITEMS hack list.
 *
 * This hook loads YOUR custom model trained on YOUR 7 waste categories.
 * It runs 100% in the browser — no Python server, no network needed.
 *
 * Categories: glass, hard_waste, liquid_waste, metal, 
 *             non_organic_waste, organic_waste, plastic
 */

// The 7 exact categories from the training dataset (garbage_classification/)
// This order MUST match the alphabetical directory order used by
// tf.keras.utils.image_dataset_from_directory in train_model.py
const CLASS_NAMES = [
  'glass',
  'hard_waste',
  'liquid_waste',
  'metal',
  'non_organic_waste',
  'organic_waste',
  'plastic',
] as const;

export type WasteClassName = (typeof CLASS_NAMES)[number];

export interface WastePrediction {
  className: WasteClassName;
  probability: number;
  /** All class probabilities, useful for showing "uncertain" state */
  allProbabilities: { className: WasteClassName; probability: number }[];
}

export const useWasteModel = () => {
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const modelRef = useRef<tf.LayersModel | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadModel = async () => {
      try {
        await tf.ready();

        // Load the custom-trained model from local files (no CDN, no network)
        // These files live in public/model/ and are served by Next.js
        const loadedModel = await tf.loadLayersModel('/model/model.json');

        if (isMounted) {
          modelRef.current = loadedModel;
          setModel(loadedModel);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load waste model:', err);
          setError(
            err instanceof Error ? err.message : 'Failed to load AI model'
          );
          setIsLoading(false);
        }
      }
    };

    loadModel();

    return () => {
      isMounted = false;
    };
  }, []);

  const predict = useCallback(
    async (videoElement: HTMLVideoElement): Promise<WastePrediction | null> => {
      const currentModel = modelRef.current;
      if (!currentModel) return null;

      // Use tf.tidy for automatic tensor cleanup — zero memory leaks
      return tf.tidy(() => {
        // 1. Capture the video frame as a tensor
        let tensor = tf.browser.fromPixels(videoElement);

        // 2. Resize to 224x224 (the input size used during training)
        tensor = tf.image.resizeBilinear(tensor, [224, 224]);

        // 3. MobileNetV2 preprocessing: scale pixels from [0, 255] to [-1, 1]
        // This EXACTLY matches tf.keras.applications.mobilenet_v2.preprocess_input()
        // which does: x = x / 127.5 - 1.0
        const preprocessed = tensor.toFloat().div(127.5).sub(1.0);

        // 4. Add batch dimension: [224, 224, 3] → [1, 224, 224, 3]
        const batched = preprocessed.expandDims(0);

        // 5. Run inference
        const predictions = currentModel.predict(batched) as tf.Tensor;
        const probabilities = predictions.dataSync() as Float32Array;

        // 6. Build sorted results
        const allProbabilities = CLASS_NAMES.map((name, idx) => ({
          className: name,
          probability: probabilities[idx],
        })).sort((a, b) => b.probability - a.probability);

        const top = allProbabilities[0];

        return {
          className: top.className,
          probability: top.probability,
          allProbabilities,
        };
      });
    },
    []
  );

  return { model, isLoading, error, predict };
};
