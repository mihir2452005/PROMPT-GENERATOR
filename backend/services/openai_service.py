
import os
import json
from openai import OpenAI

PLATFORM_GUIDES = {
    'meta_ai': {
        'name': 'Meta AI (Imagine)',
        'style': 'descriptive, photorealistic, cinematic lighting details, camera angles, aspect ratios. Focus on visual clarity and emotional tone.',
        'example_prefix': 'Create an image of'
    },
    'runway': {
        'name': 'Runway Gen-3',
        'style': 'motion-focused, describe camera movements (pan, zoom, tracking shot), scene transitions, temporal flow. Include specific duration hints and movement directions.',
        'example_prefix': 'A cinematic shot of'
    },
    'sora': {
        'name': 'OpenAI Sora',
        'style': 'highly detailed scene descriptions with temporal narrative (beginning, middle, end). Include lighting changes, weather progression, character actions over time.',
        'example_prefix': 'A video showing'
    },
    'kling': {
        'name': 'Kling AI',
        'style': 'vivid visual storytelling, emphasize textures, materials, reflections, atmospheric effects. Include motion blur, depth of field, and cinematic color grading.',
        'example_prefix': 'Generate a video of'
    },
    'pika': {
        'name': 'Pika Labs',
        'style': 'concise but evocative, focus on a single powerful visual moment with motion. Describe the key action, lighting mood, and visual style in compact form.',
        'example_prefix': 'A short clip of'
    },
    'midjourney': {
        'name': 'Midjourney',
        'style': 'artistic, use style references (--style raw, --ar 16:9), mention specific art movements, photographers, or film directors for style guidance. Include quality tags.',
        'example_prefix': ''
    },
    'stable_diffusion': {
        'name': 'Stable Diffusion',
        'style': 'tag-based, use comma-separated descriptors: quality tags (masterpiece, best quality), subject, setting, lighting, style, negative prompt considerations.',
        'example_prefix': ''
    },
    'general': {
        'name': 'General / Universal',
        'style': 'versatile, highly descriptive prompts that work across most AI video and image generators. Balance between detail and adaptability.',
        'example_prefix': ''
    }
}

def generate_ai_prompts(topic, mood, platform='general', count=5):
    """Generate multiple high-quality AI prompts optimized for a specific platform."""
    api_key = os.getenv('OPENAI_API_KEY')

    platform_info = PLATFORM_GUIDES.get(platform, PLATFORM_GUIDES['general'])

    if not api_key:
        # Fallback: generate simple but varied prompts without OpenAI
        fallback_styles = [
            f"A cinematic wide shot of {topic}, bathed in {mood} atmosphere, volumetric lighting, 8K resolution, photorealistic",
            f"Close-up dramatic view of {topic} with {mood} vibes, shallow depth of field, golden hour lighting, film grain",
            f"Aerial drone perspective of {topic}, {mood} color palette, sweeping camera movement, ultra-detailed textures",
            f"Time-lapse sequence of {topic} transitioning through {mood} tones, dynamic clouds, ambient particles floating",
            f"Intimate portrait-style scene of {topic}, {mood} undertones, soft bokeh background, ray-traced reflections, cinematic"
        ]
        return fallback_styles[:count]

    client = OpenAI(api_key=api_key)

    system_prompt = f"""You are an expert AI prompt engineer specializing in creating prompts for {platform_info['name']}.

Your prompts must be:
- Optimized for {platform_info['name']}'s specific style: {platform_info['style']}
- Highly detailed with vivid descriptions of lighting, atmosphere, camera angles, textures, and motion
- Production-ready — a user should be able to copy-paste directly into {platform_info['name']} and get stunning results
- Each prompt should be unique with different perspectives, compositions, and visual approaches
- Include technical details like resolution hints, aspect ratios, or style modifiers when appropriate

IMPORTANT: Return ONLY a valid JSON array of exactly {count} prompt strings. No explanation, no markdown, no numbering — just the raw JSON array.

Example format:
["prompt 1 text here", "prompt 2 text here", "prompt 3 text here"]"""

    user_prompt = f"Generate {count} unique, high-quality video/image generation prompts about \"{topic}\" with a \"{mood}\" mood/atmosphere. Each prompt should offer a different creative angle."

    try:
        response = client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_prompt}
            ],
            temperature=0.9,
            max_tokens=2000
        )

        content = response.choices[0].message.content.strip()
        
        # Try to parse JSON array
        try:
            prompts = json.loads(content)
            if isinstance(prompts, list) and len(prompts) > 0:
                return prompts[:count]
        except json.JSONDecodeError:
            pass

        # If JSON parsing fails, try to extract prompts from numbered list
        lines = [line.strip() for line in content.split('\n') if line.strip()]
        prompts = []
        for line in lines:
            # Remove numbering like "1.", "1)", "- " etc.
            cleaned = line.lstrip('0123456789.-) ').strip('"').strip("'").strip()
            if cleaned and len(cleaned) > 20:
                prompts.append(cleaned)
        
        if prompts:
            return prompts[:count]
        
        # Last resort: return the whole response as a single prompt
        return [content]

    except Exception as e:
        # Fallback on any error
        return [f"Cinematic {topic} with {mood} atmosphere, volumetric lighting, ultra-detailed, 8K — optimized for {platform_info['name']}."]

def get_supported_platforms():
    """Return list of supported platforms for the frontend dropdown."""
    return [
        {'id': key, 'name': info['name']}
        for key, info in PLATFORM_GUIDES.items()
    ]
