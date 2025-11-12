const fs = require('fs');

let fetch;
if (typeof globalThis.fetch === 'function') {
    fetch = globalThis.fetch;
} else {
    fetch = require('node-fetch');
    if (typeof fetch !== 'function' && fetch.default) {
        fetch = fetch.default;
    }
}

// --- CONFIGURATION ---

// HeyGen Settings
const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY || "sk_V2_hgu_kozdXIOcxRQ_dwwDOhgFcFdDJHorbkSMLlEk88uato69";
const AVATAR_ID = "Daisy-inskirt-20220818"; 
const VOICE_ID = "2d5b0e6cf36f460aa7fc47e3eee4ba54"; 
const VIDEO_TITLE_PREFIX = "AI News Summary:";
const POLLING_INTERVAL_SECONDS = 10;

// Gemini Settings
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "USE your Gemini API_KEY";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=" + GEMINI_API_KEY;

// News Feed Settings
const RSS_FEED_URL = 'http://feeds.bbci.co.uk/news/world/rss.xml';
const PROXY_URL = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(RSS_FEED_URL);

// API ENDPOINTS
const API_BASE_URL = "https://api.heygen.com";
const GENERATE_VIDEO_URL = `${API_BASE_URL}/v2/video/generate`;
const GET_VIDEO_STATUS_URL = `${API_BASE_URL}/v1/video_status.get`;



// Fetches data with exponential backoff for resilience

async function fetchWithBackoff(url, options = {}, maxRetries = 5) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            
            if (response.status === 429 || response.status >= 500) {
                // Rate limit
                throw new Error(`Server error or rate limit: ${response.status}`);
            }
            if (!response.ok) {
                const errorText = await response.text();
                if (response.status === 401 || response.status === 403) {
                     throw new Error(`Authentication/Authorization error (${response.status}). Check your API Key! Details: ${errorText.substring(0, 100)}`);
                }
                throw new Error(`HTTP error! status: ${response.status}, Details: ${errorText.substring(0, 100)}`);
            }
            return response;
        } catch (error) {
            if (i < maxRetries - 1) {
                const delay = Math.pow(2, i) * 1000 + Math.random() * 500;
                console.log(`\n\u274C Attempt ${i + 1} failed. Retrying in ${Math.round(delay / 1000)}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
}


// Strips HTML entities and tags

function cleanText(str) {
    // Basic entity decoding
    return str ? str.replace(/&[a-z]+;/g, '').replace(/<[^>]*>/g, '').trim() : '';
}

// STEP 1: FETCH NEWS & SUMMARIZE 

// Fetches the latest news item and uses Gemini to summarize it

async function fetchAndSummarizeNews() {
    console.log("--- 1. Fetching News Article...");
    let newsItem;
    try {
        const response = await fetchWithBackoff(PROXY_URL);
        const data = await response.json();
        
        if (data.status !== 'ok' || !data.items || data.items.length === 0) {
            throw new Error('RSS feed returned no valid items.');
        }
        
        newsItem = data.items[0];
        const title = cleanText(newsItem.title || 'Untitled Article');
        const contentText = cleanText(newsItem.content || newsItem.description || ''); 

        console.log(`✅ Fetched article: ${title.substring(0, 50)}...`);

        // Summarize News
        console.log("--- 2. Generating 5-Sentence Summary with Gemini...");
        
        const systemPrompt = "You are a professional news summarizer. Your task is to analyze the provided article text and generate a concise, objective summary that is exactly 5 sentences long. The summary must capture the main topic, key actors, and outcome. Do not include any introductory phrases like 'The article summarizes...'";
        
        const userQuery = `Summarize the following article in exactly 5 sentences:\n\nTitle: ${title}\n\nContent:\n${contentText}`;

        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
        };

        const geminiResponse = await fetchWithBackoff(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await geminiResponse.json();
        const summary = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!summary) {
             throw new Error('Gemini returned an empty or invalid summary.');
        }

        console.log(`✅ Summary generated:\n"${summary.substring(0, 80)}..."`);
        
        return { 
            title: title, 
            summary: summary 
        };

    } catch (error) {
        console.error("❌ Error in fetching or summarizing:", error.message);
        throw new Error("Workflow stopped due to news/summary error.");
    }
}

// STEP 2: HEYGEN VIDEO CREATION


// POST request to /v2/video/generate to start video creation

async function createAvatarVideo(apiKey, script, title) {
    const headers = {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json"
    };

    const payload = {
        "video_inputs": [
            {
                "character": {
                    "type": "avatar",
                    "avatar_id": AVATAR_ID,
                    "avatar_style": "normal"
                },
                "voice": {
                    "type": "text",
                    "input_text": script,
                    "voice_id": VOICE_ID
                },
                "background": { 
                    "type": "color", 
                    "value": "#1f2937"
                }
            }
        ],
        "dimension": {
            "width": 1280,
            "height": 720 
        },
        "title": title
    };

    console.log("--- 3. Submitting Video Generation Request to HeyGen...");
    try {
        const response = await fetchWithBackoff(GENERATE_VIDEO_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });
        
        const data = await response.json(); 

        if (data.error) {
            console.error(`❌ HeyGen Submission Error: ${data.error}`);
            if (data.code && data.message) {
                 console.error(`❌ HeyGen API Detail: Code ${data.code}, Message: ${data.message}`);
            }
            throw new Error(`HeyGen API rejected the request. Check API key and quota.`);
        }

        const videoId = data.data.video_id; 
        console.log(`✅ Submission successful. Video ID received: ${videoId}`);
        return videoId;
        
    } catch (e) {
        console.log(`❌ Failed to submit video creation request: ${e.message}`);
        return null;
    }
}


// 4. GET request to /v1/video_status.get to poll for status and retrieve URL

async function getVideoAndWait(apiKey, videoId) {
    const headers = {
        "X-Api-Key": apiKey,
        "Accept": "application/json"
    };
    
    const statusUrl = `${GET_VIDEO_STATUS_URL}?video_id=${videoId}`;
    
    console.log(`\n--- 4. Polling for Video Completion (every ${POLLING_INTERVAL_SECONDS}s)...`);
    
    while (true) {
        try {
            const dataResponse = await fetchWithBackoff(statusUrl, {
                method: 'GET',
                headers: headers
            }, 1); 

            const data = await dataResponse.json();

            const status = data.data.status;
            const videoUrl = data.data.video_url;

            if (status === 'completed') {
                console.log(`\n🎉 GET successful. Video generation completed!`);
                return videoUrl;
            }
            
            if (status === 'failed') {
                let errorDetail = data.data.error || 'No error detail provided.';
                if (typeof errorDetail === 'object') {
                    errorDetail = JSON.stringify(errorDetail, null, 2);
                }
                console.log(`\n❌ GET failed. Video generation failed. Reason:`);
                console.log(errorDetail);
                return null;
            }
            
            console.log(`Status: ${status}...`);
            await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_SECONDS * 1000));

        } catch (e) {
            console.log(`❌ Failed to check video status: ${e.message}`);
            await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_SECONDS * 1000));
            return null; 
        }
    }
}

// MAIN WORKFLOW

async function main() {
    console.log("--- AI News Summarizer & HeyGen Video Generator ---");
    
    // Check if the Gemini API key is missing
    if (!GEMINI_API_KEY) {
        console.log("\n🛑 ERROR: GEMINI_API_KEY is missing!");
        console.log("You must set the GEMINI_API_KEY environment variable to run this script locally.");
        console.log("Please get your key and set it before trying again.");
        return;
    }

    if (!HEYGEN_API_KEY || HEYGEN_API_KEY === "YOUR_HEYGEN_API_KEY_HERE") {
        console.log("🛑 ERROR: Please set your HeyGen API key in the HEYGEN_API_KEY environment variable or directly in the script.");
        return;
    }

    try {
        // Step 1 & 2: Get News and Summarize with Gemini
        const { title: newsTitle, summary: scriptText } = await fetchAndSummarizeNews();

        // Step 3: Create Video using the Gemini Summary
        const videoTitle = `${VIDEO_TITLE_PREFIX} ${newsTitle.substring(0, 40)}`;
        const videoId = await createAvatarVideo(HEYGEN_API_KEY, scriptText, videoTitle);
        
        if (!videoId) {
            console.log("\nWorkflow stopped. Video submission failed.");
            return;
        }

        // Step 4: Poll for Video Link
        const finalVideoUrl = await getVideoAndWait(HEYGEN_API_KEY, videoId);
        
        if (finalVideoUrl) {
            console.log("\n=======================================================");
            console.log("             🎉 WORKFLOW COMPLETED 🎉");
            console.log("=======================================================");
            console.log(`Article: ${newsTitle}`);
            console.log(`Summary: ${scriptText}`);
            console.log("-------------------------------------------------------");
            console.log(`▶️ Final Video URL: ${finalVideoUrl}`);
            console.log("=======================================================");
        } else {
            console.log("\nWorkflow stopped. Video creation failed or polling stopped due to error.");
        }
        
    } catch (e) {
        console.error(`\n🛑 FATAL WORKFLOW ERROR: ${e.message}`);
    }
}

// Start the main function
main();