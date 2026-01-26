chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'processContent') {
        console.log('Background script received content length:', request.content.length);
        
        // Truncate content to avoid token limits and speed up processing
        const truncatedContent = request.content.substring(0, 5000); 

        fetch('http://localhost:1234/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'local-model',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a JSON-only assistant. You summarize web pages and extract tags. You never include "thinking" process, explanations, or markdown code blocks in your response. You output raw JSON only.'
                    },
                    {
                        role: 'user',
                        content: `Provide a summary and 5 tags for this page.
Output MUST be this JSON format: {"summary": "string", "tags": ["string", "string"]}

Content:
${truncatedContent}`
                    }
                ],
                temperature: 0.2, 
                max_tokens: 2000   // Increased to allow "thinking" models to finish
            })
        })
        .then(response => {
            console.log('Received response from AI server status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Raw AI Data:', data);
            let rawContent = data.choices[0].message.content;
            
            // 1. Remove <think>...</think> blocks if present
            rawContent = rawContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

            // 2. Extract JSON object using Regex (finds text between first { and last })
            const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
            
            let result;
            if (jsonMatch) {
                try {
                    result = JSON.parse(jsonMatch[0]);
                } catch (e) {
                    console.error('JSON Parse Error on extracted string:', e);
                }
            }

            // Fallback object if parsing fails
            if (!result || !result.summary) {
                console.warn('Fallback: Failed to parse AI JSON.');
                result = {
                    summary: 'Analysis completed, but format was invalid.',
                    tags: ['web']
                };
            }

            const newBookmark = {
                url: request.url,
                summary: result.summary,
                tags: result.tags,
                createdAt: new Date().toISOString()
            };

            chrome.storage.local.get(['bookmarks'], (storage) => {
                const bookmarks = storage.bookmarks || [];
                bookmarks.push(newBookmark);
                chrome.storage.local.set({ bookmarks }, () => {
                    console.log('Bookmark saved successfully:', newBookmark);
                });
            });
        })
        .catch(error => console.error('Error in background script fetch:', error));
    }
});