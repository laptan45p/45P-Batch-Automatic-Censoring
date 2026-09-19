declare module "onnxruntime-web" {
  export class Tensor {
    constructor(
      type: "float32" | "int32" | "int64" | "uint8",
      data: Float32Array | Int32Array | BigInt64Array | Uint8Array,
      dims: number[],
    );
    readonly data: Float32Array | Int32Array | BigInt64Array | Uint8Array;
    readonly dims: number[];
  }

  export class InferenceSession {
    static create(
      uriOrBuffer: string | ArrayBuffer | Uint8Array,
      options?: {
        executionProviders?: string[];
        graphOptimizationLevel?: "disabled" | "basic" | "extended" | "all";
      },
    ): Promise<InferenceSession>;
    readonly inputNames: string[];
    readonly outputNames: string[];
    run(feeds: Record<string, Tensor>): Promise<Record<string, Tensor>>;
  }

  export const env: {
    wasm: {
      wasmPaths: string | Record<string, string>;
      numThreads: number;
      simd: boolean;
      proxy: boolean;
    };
  };
}
