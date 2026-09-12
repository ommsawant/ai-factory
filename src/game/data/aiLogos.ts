/**
 * AI Tools quiz data for the Sudden Death "Golden Ticket" phase.
 *
 * Pure data — no SDK, no React. Safe to import in any layer.
 * Update this list before the expo to swap in real logo assets.
 */

export interface AiLogo {
  /** Stable identifier used as the answer key in the quiz action. */
  id: string;
  /** Display name shown on the host screen as the question. */
  name: string;
  /** Path relative to the public root, e.g. "/logos/chatgpt.svg" */
  logo: string;
  /** Short tagline shown below the logo on the controller grid. */
  tagline: string;
}

export const AI_LOGOS: AiLogo[] = [
  { id: "chatgpt",          name: "ChatGPT",         logo: "/logos/chatgpt.png",          tagline: "OpenAI chat assistant" },
  { id: "gemini",           name: "Gemini",           logo: "/logos/gemini.png",           tagline: "Google's AI model" },
  { id: "claude",           name: "Claude",           logo: "/logos/claude.png",           tagline: "Anthropic's AI" },
  { id: "midjourney",       name: "Midjourney",       logo: "/logos/midjourney.png",       tagline: "AI image generation" },
  { id: "dalle",            name: "DALL-E",           logo: "/logos/dalle.png",            tagline: "OpenAI image model" },
  { id: "grok",             name: "Grok",             logo: "/logos/grok.svg",             tagline: "xAI chatbot" },
  { id: "cursor",           name: "Cursor",           logo: "/logos/cursor.svg",           tagline: "AI code editor" },
  { id: "notion_ai",        name: "Notion AI",        logo: "/logos/notion_ai.svg",        tagline: "AI writing assistant" },
  { id: "stable_diffusion", name: "Stable Diffusion", logo: "/logos/stable_diffusion.png", tagline: "Open image model" },
  { id: "github_copilot",   name: "GitHub Copilot",   logo: "/logos/github_copilot.svg",   tagline: "AI pair programmer" },
  { id: "perplexity",       name: "Perplexity",       logo: "/logos/perplexity.svg",       tagline: "AI search engine" },
  { id: "suno",             name: "Suno",             logo: "/logos/suno.svg",             tagline: "AI music generator" },
  { id: "runway",           name: "Runway",           logo: "/logos/runway.svg",           tagline: "AI video generation" },
  { id: "elevenlabs",       name: "ElevenLabs",       logo: "/logos/elevenlabs.svg",       tagline: "AI voice synthesis" },
  { id: "huggingface",      name: "Hugging Face",     logo: "/logos/huggingface.svg",      tagline: "Open ML platform" },
];

/** Total number of quiz questions. */
export const QUIZ_LENGTH = AI_LOGOS.length; // 15
