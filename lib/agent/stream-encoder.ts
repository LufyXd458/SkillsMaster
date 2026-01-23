import type { AgentEvent } from "./event-types";

export function encodeSSE(event: AgentEvent): string {
  const data = JSON.stringify(event);
  return `data: ${data}\n\n`;
}

export function createSSEStream(): {
  stream: ReadableStream<Uint8Array>;
  writer: {
    write: (event: AgentEvent) => void;
    close: () => void;
    error: (err: Error) => void;
  };
} {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array>;

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
  });

  return {
    stream,
    writer: {
      write(event: AgentEvent) {
        const encoded = encoder.encode(encodeSSE(event));
        controller.enqueue(encoded);
      },
      close() {
        controller.close();
      },
      error(err: Error) {
        controller.error(err);
      },
    },
  };
}
