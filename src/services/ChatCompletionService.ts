import OpenAI from "openai";
import retry from "async-retry";

export type ChatRequestParams =
  OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming;

export type ToolHandler = (
  name: string,
  args: unknown,
) => Promise<unknown> | unknown;

export class ChatCompletionService {
  private openai: OpenAI;

  constructor(apiKey: string, baseURL?: string) {
    this.openai = new OpenAI({ apiKey, baseURL });
  }

  async send(
    params: ChatRequestParams,
    toolHandler?: ToolHandler,
    maxIterations: number = 10,
  ): Promise<string> {
    return retry(
      async () => {
        const first = await this.openai.chat.completions.create(params);
        let message = first.choices[0].message;
        let iterations = 0;
        params.messages.push(message);
        let currentParams = params;
        while (
          message.tool_calls &&
          message.tool_calls.length > 0 &&
          iterations < maxIterations
        ) {
          const { nextMessage, nextParams } =
            await this.processCompletionWithTools(
              currentParams,
              message.tool_calls,
              toolHandler,
            );
          message = nextMessage;
          currentParams = nextParams;
          iterations++;
        }
        if (
          iterations >= maxIterations &&
          message.tool_calls &&
          message.tool_calls.length > 0
        ) {
          throw new Error(
            `Max tool iteration reached ${iterations}, but tool call returned.`,
          );
        }
        return message?.content?.toString() || "";
      },
      { retries: 3, minTimeout: 500 },
    );
  }

  private async processCompletionWithTools(
    params: ChatRequestParams,
    toolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[],
    toolHandler?: ToolHandler,
  ): Promise<{
    nextMessage: OpenAI.Chat.Completions.ChatCompletionMessage;
    nextParams: ChatRequestParams;
  }> {
    const newMessages = params.messages ? [...params.messages] : [];
    console.log("Processing completion with tool calls", toolCalls);
    for (const toolCall of toolCalls) {
      if (toolCall.type !== "function") continue;
      if (!toolCall.function.arguments) continue;
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);
      if (!toolHandler)
        throw new Error(`No tool handler provided for ${functionName}`);
      const functionResponse = await toolHandler(functionName, functionArgs);
      const toolCallBody = {
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(functionResponse),
      } as OpenAI.Chat.Completions.ChatCompletionMessageParam;
      newMessages.push(toolCallBody);
      console.log("Update messages with tool call", toolCallBody);
    }
    const nextParams: ChatRequestParams = {
      ...params,
      messages: newMessages,
    } as ChatRequestParams;
    console.log("Sending tool completion request with params", nextParams);
    const resp = await this.openai.chat.completions.create(nextParams);
    return { nextMessage: resp.choices[0].message, nextParams };
  }
}
