
import os
import json
from openai import OpenAI

PLATFORM_GUIDES = {
    'meta_ai': {
        'name': 'Meta AI (Imagine)',
        'style': 'highly descriptive, detailed visual sequences, cinematic framing, photo-realistic rendering, and dynamic lighting modifiers.',
        'example_prefix': 'A cinematic video sequence of'
    },
    'runway': {
        'name': 'Runway Gen-3',
        'style': 'high-motion control, specify camera trajectories (dynamic pan, dollying, hyperlapse, crane shot), temporal scene changes, and physics animations.',
        'example_prefix': 'Cinematic shot of'
    },
    'sora': {
        'name': 'OpenAI Sora',
        'style': 'highly complex chronological narratives, multi-subject interactions, photorealistic physics simulation, and sweeping camera storytelling.',
        'example_prefix': 'A beautifully detailed video showing'
    },
    'kling': {
        'name': 'Kling AI',
        'style': 'intense material realism, photorealistic textures (hair, rain, skin, glass), fluid dynamics, reflection realism, and soft dramatic depth of field.',
        'example_prefix': 'Vivid cinematic scene of'
    },
    'pika': {
        'name': 'Pika Labs',
        'style': 'fast-paced visual dynamics, key action-driven descriptions, 3D camera rotation, and atmospheric effect changes.',
        'example_prefix': 'A dynamic clip of'
    },
    'midjourney': {
        'name': 'Midjourney',
        'style': 'vivid composition, cinematic cinematic, art style directions, rendering engine modifiers, hyper-detailed setting descriptors.',
        'example_prefix': ''
    },
    'stable_diffusion': {
        'name': 'Stable Diffusion',
        'style': 'structural descriptions, precise composition terms, volumetric atmospheric tags, high resolution keywords, color grading palettes.',
        'example_prefix': ''
    },
    'general': {
        'name': 'General / Universal',
        'style': 'highly adaptive storyboard layouts, detailed shot directions, camera transitions, and environmental color moods.',
        'example_prefix': ''
    }
}

def generate_ai_prompts(topic, mood, platform='general', count=5):
    """Generate multiple high-quality, story-driven, timeline-based video scripts optimized for a specific platform."""
    api_key = os.getenv('OPENAI_API_KEY')
    platform_info = PLATFORM_GUIDES.get(platform, PLATFORM_GUIDES['general'])

    # Rich timeline-based fallback prompts to guarantee 5 high-quality results even without an API key
    fallback_prompts = [
        f"🎬 **Storyboard Sequence: The Opening Shot**\n"
        f"**Visual Concept**: A breathtaking cinematic shot of {topic} engulfed in a deep {mood} atmosphere.\n"
        f"**Camera Movement**: Smooth, slow drone fly-by panning downwards to establish the grand scale of the landscape.\n"
        f"**Temporal Timeline**:\n"
        f"- **[0:00 - 0:02]**: The camera sweeps past high cinematic clouds, revealing {topic} illuminated by a faint, soft backlight.\n"
        f"- **[0:02 - 0:05]**: On second 2, a sudden shift in lighting highlights moving dust particles and atmospheric glow; shadows stretch gracefully.\n"
        f"- **[0:05 - 0:10]**: From second 5 onwards, the camera dollys closer as subtle fluid animations start to float gently across the frame.\n"
        f"**Special Features**: Dynamic volumetric fog, realistic lighting flares, 8K resolution.",

        f"🎬 **Storyboard Sequence: The Macro Focus**\n"
        f"**Visual Concept**: An intimate, hyper-detailed macro view focusing on the fine textures of {topic} reflecting a {mood} ambient palette.\n"
        f"**Camera Movement**: Extremely narrow depth-of-field close-up with a slow, continuous focus-pull from the background to the foreground.\n"
        f"**Temporal Timeline**:\n"
        f"- **[0:00 - 0:02]**: The frame starts with a soft, circular bokeh. Only the outermost edge of {topic} is visible in sharp detail.\n"
        f"- **[0:02 - 0:05]**: On second 3, the lens smoothly shifts focus, revealing glowing liquid droplets or metallic reflections shifting under the light.\n"
        f"- **[0:05 - 0:10]**: From second 6, the lighting brightens slightly and the camera tilts, capturing dramatic shadows moving across the micro-surfaces.\n"
        f"**Special Features**: Ray-traced reflections, high-speed camera motion capture (120fps feel).",

        f"🎬 **Storyboard Sequence: The Transition Phase**\n"
        f"**Visual Concept**: A dynamic time-lapse sequence showcasing {topic} undergoing a magical environmental transition reflecting the {mood} theme.\n"
        f"**Camera Movement**: Static camera position on a steady tripod with dramatic zoom magnification.\n"
        f"**Temporal Timeline**:\n"
        f"- **[0:00 - 0:02]**: The scene opens under quiet, overcast skies. The textures of {topic} appear still and heavy.\n"
        f"- **[0:02 - 0:05]**: On second 2, a sudden energetic burst of particles or weather changes starts to sweep across the scene; clouds roll fast.\n"
        f"- **[0:05 - 0:10]**: From second 5, the transition reaches its peak with luminous rays piercing through, casting long, epic shadows.\n"
        f"**Special Features**: High-speed cloud motion, dynamic wind/dust simulations.",

        f"🎬 **Storyboard Sequence: The Action Sequence**\n"
        f"**Visual Concept**: An epic, high-energy action tracking shot centered around {topic} with a powerful, cinematic {mood} undertone.\n"
        f"**Camera Movement**: Fast-moving tracking shot that flies alongside the subject, maintaining low-angle perspective.\n"
        f"**Temporal Timeline**:\n"
        f"- **[0:00 - 0:02]**: Intense action begins instantly. Debris or sparks fly past the camera lens in slow motion.\n"
        f"- **[0:02 - 0:05]**: On second 3, a dramatic burst of energy or motion change pushes the camera backwards, emphasizing speed and scale.\n"
        f"- **[0:05 - 0:10]**: From second 6 to 10, the motion decelerates into a gorgeous, stylized bullet-time sequence showing floating elements frozen in air.\n"
        f"**Special Features**: Slow-motion action mechanics, highly detailed interactive particle systems.",

        f"🎬 **Storyboard Sequence: The Climactic Close**\n"
        f"**Visual Concept**: A highly emotional, artistic visualization of {topic} that brings out a deep, lingering {mood} feeling.\n"
        f"**Camera Movement**: Slow crane shot rising up and pulling back, gradually revealing the wider, massive context of the scene.\n"
        f"**Temporal Timeline**:\n"
        f"- **[0:00 - 0:02]**: The camera starts extremely close to a key focal element of {topic}, capturing soft, warm environmental reflections.\n"
        f"- **[0:02 - 0:05]**: On second 3, the crane rises. A beautiful silhouette forms against a dramatic backdrop lighting source.\n"
        f"- **[0:05 - 0:10]**: The camera continues rising to reveal a grand, atmospheric view; elements fade softly into misty horizons.\n"
        f"**Special Features**: Masterpiece color grading, cinematic atmospheric haze, cinematic aspect ratio."
    ]

    if not api_key:
        return fallback_prompts[:count]

    client = OpenAI(api_key=api_key)

    system_prompt = f"""You are a world-class AI Prompt Engineer and cinematic video director specializing in creating professional storyboards and video script prompts for {platform_info['name']}.

Your goal is to generate {count} highly detailed, epic, and cinematic video script prompts.
Every single prompt you generate must be a comprehensive storyboard featuring an animation timeline detailing EXACTLY what happens second-by-second (e.g. from second 0 to second 10).

Each of the {count} prompts in the JSON list MUST follow this exact, rich formatting structure:

🎬 **Storyboard Sequence: [Epic Creative Title]**
**Visual Concept**: [Vivid and detailed description of the scene's visual subject, elements, atmosphere, and {platform_info['style']}]
**Camera Movement**: [Exact professional camera direction: e.g. dollying, panning, crane shot, focus pull, focal lengths, speeds]
**Temporal Timeline**:
- **[0:00 - 0:02]**: [Describe what happens at the start of the video. Focus on composition and initial subject action]
- **[0:02 - 0:05]**: [On second 2, detail how the scene animatedly changes, what movement occurs, shifts in lighting, or environmental reactions]
- **[0:05 - 0:10]**: [From second 5 to 10, detail the epic climax, camera transitions, slow-motion features, and final shot composition]
**Special Animation Features**: [Fluid dynamics, glowing particles, wind effects, material transformations, or lighting shifts to animate the scene]
**Optimized for {platform_info['name']}**: [Specific camera settings, aspect ratios like --ar 16:9, motion rates, resolution tags, photorealistic style settings]

IMPORTANT: You must return ONLY a valid JSON array of exactly {count} strings. Do NOT include markdown around the JSON, do NOT output code block formatting (like ```json), and do not add any conversational text. Return only the raw JSON array of strings so that it can be parsed perfectly by `json.loads`.

Example output format:
[
  "🎬 **Storyboard Sequence: ...**\\n**Visual Concept**: ...\\n**Camera Movement**: ...\\n**Temporal Timeline**:\\n- **[0:00 - 0:02]**: ...\\n- **[0:02 - 0:05]**: ...\\n- **[0:05 - 0:10]**: ...\\n**Special Animation Features**: ...\\n**Optimized for Midjourney**: ...",
  "..."
]"""

    user_prompt = f"Generate {count} unique, highly cinematic, story-driven, second-by-second video script prompts about \"{topic}\" with a powerful \"{mood}\" mood/atmosphere. Ensure the prompts are long, highly descriptive, and optimized for {platform_info['name']}."

    try:
        response = client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_prompt}
            ],
            temperature=0.85,
            max_tokens=3000
        )

        content = response.choices[0].message.content.strip()
        
        # Strip code blocks if OpenAI returns them despite instructions
        if content.startswith('```json'):
            content = content[7:]
        if content.startswith('```'):
            content = content[3:]
        if content.endswith('```'):
            content = content[:-3]
        content = content.strip()

        # Try to parse JSON array
        try:
            prompts = json.loads(content)
            if isinstance(prompts, list) and len(prompts) > 0:
                return prompts[:count]
        except json.JSONDecodeError:
            pass

        # If JSON parsing fails, try to extract prompts by splitting on custom delimiters
        # Or parse lines and look for 🎬 symbols
        parts = content.split('🎬')
        prompts = []
        for part in parts:
            part_str = part.strip()
            if part_str and len(part_str) > 100:
                prompts.append('🎬 ' + part_str)

        if len(prompts) >= count:
            return prompts[:count]
        
        # Fallback to the parsed lines method
        lines = [line.strip() for line in content.split('\n') if line.strip()]
        temp_prompts = []
        current_prompt = []
        for line in lines:
            if line.startswith('🎬') or 'Storyboard Sequence' in line:
                if current_prompt:
                    temp_prompts.append('\n'.join(current_prompt))
                    current_prompt = []
            current_prompt.append(line)
        if current_prompt:
            temp_prompts.append('\n'.join(current_prompt))
        
        valid_prompts = [p for p in temp_prompts if len(p.strip()) > 100]
        if len(valid_prompts) > 0:
            return valid_prompts[:count]

        # Last resort: return the fallback prompts so user gets a pristine 5-card experience
        return fallback_prompts[:count]

    except Exception as e:
        # Fallback on any error to ensure uninterrupted high-quality user experience
        return fallback_prompts[:count]

def get_supported_platforms():
    """Return list of supported platforms for the frontend dropdown."""
    return [
        {'id': key, 'name': info['name']}
        for key, info in PLATFORM_GUIDES.items()
    ]

