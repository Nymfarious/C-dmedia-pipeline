import { vi } from 'vitest';

export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function mockAsyncOperation<T>(
  result: T,
  delay = 0,
  shouldFail = false
): () => Promise<T> {
  return vi.fn().mockImplementation(() => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (shouldFail) {
          reject(new Error('Mocked async operation failed'));
        } else {
          resolve(result);
        }
      }, delay);
    });
  });
}

export function mockAsyncSequence<T>(
  results: T[],
  delay = 0
): () => Promise<T> {
  let callCount = 0;
  return vi.fn().mockImplementation(() => {
    const result = results[callCount % results.length];
    callCount++;
    return new Promise(resolve => {
      setTimeout(() => resolve(result), delay);
    });
  });
}

export async function expectAsyncError(
  asyncFn: () => Promise<any>,
  expectedError?: string | RegExp
): Promise<void> {
  try {
    await asyncFn();
    throw new Error('Expected async function to throw an error');
  } catch (error) {
    if (expectedError) {
      if (typeof expectedError === 'string') {
        expect(error.message).toContain(expectedError);
      } else {
        expect(error.message).toMatch(expectedError);
      }
    }
  }
}