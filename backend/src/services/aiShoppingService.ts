import OpenAI from 'openai';
import { searchProducts, SearchFilters } from './productSearchService';

const openai = new OpenAI({
    baseURL: 'http://localhost:11434/v1',
    apiKey: 'ollama', // Ollama doesn't need a real key, but the SDK requires a string
});

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
        type: 'function',
        function: {
            name: 'search_products',
            description: 'Search the SmartMarket product catalog based on user criteria such as keywords, budget, and stock availability.',
            parameters: {
                type: 'object',
                properties: {
                    keyword: {
                        type: 'string',
                        description: 'Keyword to search in product name or description (e.g., mouse, headphones, backpack).'
                    },
                    maxPrice: {
                        type: 'number',
                        description: 'Maximum budget or price limit specified by the customer in ETB.'
                    },
                    minPrice: {
                        type: 'number',
                        description: 'Minimum price limit specified by the customer in ETB.'
                    },
                    inStockOnly: {
                        type: 'boolean',
                        description: 'Set to true if the user specifically requests items in stock.'
                    }
                },
                required: []
            }
        }
    }
];

export const processUserMessage = async (userMessage: string) => {
    try {
        const initialResponse = await openai.chat.completions.create({
            model: 'qwen2.5:1.5b', // Updated to local model
            messages: [
                {
                    role: 'system',
                    content: `You are SmartMarket's helpful AI shopping assistant. 
                    Always search the catalog using the available search tool when customers ask for products. 
                    Only recommend real products returned from the database search. 
                    Never invent prices, stock, or product features.`
                },
                {
                    role: 'user',
                    content: userMessage
                }
            ],
            tools: tools,
            tool_choice: 'auto',
        });

        const responseMessage = initialResponse.choices[0].message;
        const toolCalls = responseMessage.tool_calls;

        if (toolCalls && toolCalls.length > 0) {
            let fetchedProducts: any[] = [];

            for (const toolCall of toolCalls) {
                if (toolCall.type === 'function' && toolCall.function.name === 'search_products') {
                    const filters: SearchFilters = JSON.parse(toolCall.function.arguments);
                    
                    fetchedProducts = await searchProducts(filters);
                    
                    const finalResponse = await openai.chat.completions.create({
                        model: 'qwen2.5:1.5b', 
                        messages: [
                            {
                                role: 'system',
                                content: `You are SmartMarket's shopping assistant. Explain the recommendations clearly using only the provided database results.`
                            },
                            {
                                role: 'user',
                                content: userMessage
                            },
                            responseMessage,
                            {
                                role: 'tool',
                                tool_call_id: toolCall.id,
                                content: JSON.stringify(fetchedProducts)
                            }
                        ]
                    });

                    return {
                        success: true,
                        reply: finalResponse.choices[0].message.content,
                        products: fetchedProducts
                    };
                }
            }
        }

        return {
            success: true,
            reply: responseMessage.content,
            products: []
        };

    } catch (error: any) {
        console.error('Error in AI shopping service:', error.message);
        throw new Error('Failed to process request with AI assistant');
    }
};