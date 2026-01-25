// normalize.js — Message Normalization Layer
// Sacred Ground: Clean extraction with confidence scoring

function normalizeAssistantMessage(node, hostname) {
  let text = '';
  let confidence = 0;
  let artifacts = [];
  let metadata = {};

  switch (hostname) {
    case 'chatgpt.com':
      // ChatGPT: Look for assistant message container
      const chatGPTMsg = node.closest('[data-message-author-role="assistant"]');
      if (chatGPTMsg) {
        // Try markdown renderer first (higher quality)
        const markdown = chatGPTMsg.querySelector('.markdown');
        if (markdown) {
          text = markdown.innerText.trim();
          confidence = 0.95;
        } else {
          text = chatGPTMsg.innerText.trim();
          confidence = 0.9;
        }

        // Remove sources/citations block
        text = text.replace(/^Sources?:[\s\S]*$/im, '').trim();
        text = text.replace(/\[\d+\]\s*$/gm, '').trim();

        // Remove "ChatGPT can make mistakes" footer
        text = text.replace(/ChatGPT can make mistakes[\s\S]*$/i, '').trim();

        artifacts.push('citations stripped');
      }
      break;

    case 'claude.ai':
      // Claude: Multiple possible containers
      const claudeMsg = node.closest('[data-is-streaming]') ||
                       node.closest('.font-claude-message') ||
                       node.querySelector('.prose');

      if (claudeMsg) {
        // Check for thinking blocks (should be ignored)
        const thinkingBlock = claudeMsg.querySelector('[data-thinking]');
        if (thinkingBlock) {
          thinkingBlock.remove();
          artifacts.push('thinking block removed');
        }

        // Check for tool use blocks
        const toolBlocks = claudeMsg.querySelectorAll('[data-tool-use]');
        toolBlocks.forEach(block => {
          block.remove();
          artifacts.push('tool block removed');
        });

        text = claudeMsg.innerText.trim();
        confidence = 0.92;

        // Remove thinking tags if they leaked through
        text = text.replace(/^<thinking>[\s\S]*?<\/thinking>\s*/i, '').trim();
        text = text.replace(/Thinking:[\s\S]*?(?=\n\n|$)/i, '').trim();
      }
      break;

    case 'gemini.google.com':
      // Gemini: Response container
      const geminiMsg = node.querySelector('[data-test-id*="response"]') ||
                       node.querySelector('.model-response') ||
                       node.closest('.response-container');

      if (geminiMsg) {
        // Remove loading indicators
        const loading = geminiMsg.querySelector('.loading');
        if (loading) loading.remove();

        text = geminiMsg.innerText.trim();
        confidence = 0.88;

        // Strip citations [1], [2], etc.
        text = text.replace(/\[\d+\]/g, '').trim();

        // Remove "Learn more" links
        text = text.replace(/Learn more[\s\S]*$/i, '').trim();

        artifacts.push('citations stripped');
      }
      break;

    case 'grok.x.ai':
      // Grok (x.ai): Message structure
      const grokMsg = node.closest('[data-testid="grok-response"]') ||
                     node.querySelector('.grok-message') ||
                     node.closest('.message-container');

      if (grokMsg) {
        text = grokMsg.innerText.trim();
        confidence = 0.9;

        // Grok sometimes includes source indicators
        text = text.replace(/Sources?:[\s\S]*$/im, '').trim();

        // Remove "Powered by" footer
        text = text.replace(/Powered by[\s\S]*$/i, '').trim();
      }
      break;

    case 'perplexity.ai':
      // Perplexity: Prose container with heavy citation use
      const perplexityMsg = node.querySelector('.prose') ||
                           node.closest('[class*="answer"]') ||
                           node.closest('.response');

      if (perplexityMsg) {
        // Clone to avoid modifying DOM
        const clone = perplexityMsg.cloneNode(true);

        // Remove citation superscripts
        const citations = clone.querySelectorAll('sup');
        citations.forEach(cite => cite.remove());

        text = clone.innerText.trim();
        confidence = 0.91;

        // Strip inline citations
        text = text.replace(/\[\d+\]/g, '').trim();

        // Remove "Sources" section
        text = text.replace(/^Sources[\s\S]*$/im, '').trim();
        text = text.replace(/^Related[\s\S]*$/im, '').trim();

        artifacts.push('citations stripped', 'related removed');
      }
      break;

    default:
      // Fallback heuristic for unknown sites
      // Look for common assistant message patterns
      const possibleMsg = node.querySelector('.assistant-message') ||
                         node.querySelector('[role="article"]') ||
                         node.querySelector('.message-content');

      if (possibleMsg && possibleMsg.innerText.length > 150) {
        text = possibleMsg.innerText.trim();
        confidence = 0.65;
        artifacts.push('fallback heuristic used');
      }
  }

  if (text) {
    // Universal cleanup
    text = text.replace(/\n{3,}/g, '\n\n').trim(); // Normalize line breaks
    text = text.replace(/\t+/g, ' ').trim(); // Tabs to spaces
    text = text.replace(/[ ]{2,}/g, ' ').trim(); // Multiple spaces to single

    // Extract metadata
    metadata.wordCount = text.split(/\s+/).length;
    metadata.paragraphs = text.split(/\n\n+/).length;
    metadata.hasQuestions = /\?/.test(text);
    metadata.hasList = /^[\s]*[-•*]\s/m.test(text);

    // Adjust confidence based on quality indicators
    if (text.length < 50) {
      confidence *= 0.7; // Very short responses are less confident
    }
    if (metadata.wordCount > 500) {
      confidence *= 1.05; // Longer responses likely correct extraction
      confidence = Math.min(confidence, 1.0);
    }

    return {
      text,
      confidence,
      artifactsRemoved: artifacts,
      metadata,
      hostname
    };
  }

  return null;
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { normalizeAssistantMessage };
}
