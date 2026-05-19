
import os
import json
from openai import OpenAI

PLATFORM_GUIDES = {
    'meta_ai': {
        'name': 'Meta AI (Imagine)',
        'style': 'highly descriptive visual sequences, cinematic framing, photo-realistic rendering, and dynamic lighting modifiers.',
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
    'luma': {
        'name': 'Luma Dream Machine',
        'style': 'fluid physical motion, realistic physics simulations, smooth camera dollies, dramatic spatial transitions, and high-fidelity lighting shifts.',
        'example_prefix': 'Cinematic video sequence of'
    },
    'haiper': {
        'name': 'Haiper AI',
        'style': 'high-fidelity action dynamics, stylized slow-motion transitions, detailed volumetric fog, raytraced reflections, and seamless temporal flow.',
        'example_prefix': 'A sweeping video showing'
    },
    'general': {
        'name': 'General Video',
        'style': 'highly adaptive storyboard layouts, detailed shot directions, cinematic camera transitions, and environmental color moods optimized for video generation.',
        'example_prefix': 'Cinematic video of'
    }
}

def generate_ai_prompts(topic, mood, platform='general', count=5):
    """Generate multiple high-quality, story-driven, timeline-based video scripts optimized for a specific platform."""
    api_key = os.getenv('OPENAI_API_KEY')
    platform_info = PLATFORM_GUIDES.get(platform, PLATFORM_GUIDES['general'])

    # Rich multi-part fallback prompts (Part 1 and Part 2) to guarantee a spectacular offline experience
    fallback_prompts = [
        f"🎬 **Storyboard: The Epic Opening**\n"
        f"**Visual Concept**: A grand visual masterpiece showing {topic} with a strong {mood} style.\n"
        f"**Camera Trajectory**: Dynamic cinematic pan seamlessly tracking from close up to establishing wide-angle.\n"
        f"**Part 1 Video Prompt (0:00 - 0:05)**:\n"
        f"- **Action**: Cinematic close-up on the central details of {topic} as atmospheric {mood} light flares slowly pass across the lens.\n"
        f"- **Camera**: Smooth 3D gimbal tracking pan moving right to left.\n"
        f"- **Meta AI/Engine Prompt**: `Cinematic tracking shot of {topic}, shallow depth of field, warm {mood} volumetric lighting, photorealistic --ar 16:9`\n"
        f"**Part 2 Video Prompt (0:05 - 0:10)** (Seamless Continuation):\n"
        f"- **Action**: The camera pulls back dramatically, seamlessly revealing the entire glowing expanse of the setting under changing lighting transitions.\n"
        f"- **Camera**: Dynamic crane shot rising up and back, maintaining continuous subject focus.\n"
        f"- **Meta AI/Engine Prompt**: `Dolly-out drone perspective, continuous flow from previous scene, {topic} fully revealed, deep shadows, cinematic scale --ar 16:9`\n"
        f"**Fluid Effects**: Volumetric clouds, raytraced reflections.",

        f"🎬 **Storyboard: The Micro & Macro Focus**\n"
        f"**Visual Concept**: An intimate view focusing on the fine textures of {topic} reflecting a {mood} ambient palette.\n"
        f"**Camera Trajectory**: Focus pull transitioning from abstract background bokeh into macro level clarity.\n"
        f"**Part 1 Video Prompt (0:00 - 0:05)**:\n"
        f"- **Action**: Extreme close-up of {topic} surfaces, catching soft circular light rays bouncing off organic edges.\n"
        f"- **Camera**: Slow, delicate forward push along the Z-axis.\n"
        f"- **Meta AI/Engine Prompt**: `Macro lens close up of {topic}, soft {mood} mood, bokeh reflections, highly detailed, slow slide --ar 16:9`\n"
        f"**Part 2 Video Prompt (0:05 - 0:10)** (Seamless Continuation):\n"
        f"- **Action**: Focus smoothly shifts from the front texture to reveal a larger moving subject or water droplet sliding off {topic}.\n"
        f"- **Camera**: Slow focal transition with a gentle camera rotation.\n"
        f"- **Meta AI/Engine Prompt**: `Macro focus-pull on {topic}, glowing liquid droplet sliding down, dramatic shadows, HSL color grade --ar 16:9`\n"
        f"**Fluid Effects**: Water droplet simulation, cinematic focus-pull.",

        f"🎬 **Storyboard: The Atmospheric Transition**\n"
        f"**Visual Concept**: A dynamic sequence showcasing {topic} undergoing a magical environmental transition reflecting the {mood} theme.\n"
        f"**Camera Trajectory**: Static tripod position with sweeping panning movement.\n"
        f"**Part 1 Video Prompt (0:00 - 0:05)**:\n"
        f"- **Action**: The scene starts with {topic} shrouded in deep, heavy {mood} shadows, mist swirling at the base.\n"
        f"- **Camera**: Static locked-off composition with subtle camera vibrations.\n"
        f"- **Meta AI/Engine Prompt**: `Atmospheric moody shot of {topic} covered in dense mist, misty shadows, realistic physics, dark cinematic style --ar 16:9`\n"
        f"**Part 2 Video Prompt (0:05 - 0:10)** (Seamless Continuation):\n"
        f"- **Action**: Mist begins to thin rapidly as powerful glowing light rays pierce through the clouds, lighting up {topic}.\n"
        f"- **Camera**: Slow tracking dolly-in through the thinning haze.\n"
        f"- **Meta AI/Engine Prompt**: `Cinematic dolly through mist, dramatic light beams revealing {topic}, dynamic weather, particles in light --ar 16:9`\n"
        f"**Fluid Effects**: Realistic mist simulation, particle wind.",

        f"🎬 **Storyboard: The Dynamic Action Run**\n"
        f"**Visual Concept**: An epic, high-energy action tracking shot centered around {topic} with a powerful, cinematic {mood} undertone.\n"
        f"**Camera Trajectory**: High speed horizontal tracking shot alongside the main subject.\n"
        f"**Part 1 Video Prompt (0:00 - 0:05)**:\n"
        f"- **Action**: Energetic movement begins instantly, sparks and dust flying off {topic} as it animates into action.\n"
        f"- **Camera**: Fast tracking shot moving horizontally.\n"
        f"- **Meta AI/Engine Prompt**: `Action tracking shot of {topic} moving fast, glowing sparks flying behind, high speed action, cinematic --ar 16:9`\n"
        f"**Part 2 Video Prompt (0:05 - 0:10)** (Seamless Continuation):\n"
        f"- **Action**: A sudden slow-motion drop where all sparks freeze in the air in bullet-time around {topic}.\n"
        f"- **Camera**: Orbiting 360-degree rotational camera movement in super slow motion.\n"
        f"- **Meta AI/Engine Prompt**: `Super slow motion bullet-time orbit of {topic}, frozen glowing particles in mid-air, 3D rotating angle, photorealistic --ar 16:9`\n"
        f"**Fluid Effects**: High-speed particle system, custom bullet-time simulation.",

        f"🎬 **Storyboard: The Cinematic Horizon**\n"
        f"**Visual Concept**: A highly emotional, artistic visualization of {topic} that brings out a deep, lingering {mood} feeling.\n"
        f"**Camera Trajectory**: High vertical rise transitioning into a peaceful sweeping horizon.\n"
        f"**Part 1 Video Prompt (0:00 - 0:05)**:\n"
        f"- **Action**: Close silhouette of {topic} resting against a gorgeous, sweeping gradient background of {mood} sky.\n"
        f"- **Camera**: Slow, rhythmic vertical crane rising upwards.\n"
        f"- **Meta AI/Engine Prompt**: `Low angle silhouette of {topic}, glowing colorful sky, cinematic gradients, peaceful HSL colors, majestic crane shot --ar 16:9`\n"
        f"**Part 2 Video Prompt (0:05 - 0:10)** (Seamless Continuation):\n"
        f"- **Action**: The camera reaches the peak of the crane, fully capturing a breathtaking sunset/sunrise casting long gold shadows across the horizon.\n"
        f"- **Camera**: Slow, elegant panning shot towards the sun.\n"
        f"- **Meta AI/Engine Prompt**: `Cinematic sunset panning shot, golden hours, {topic} in landscape silhouette, long shadows, perfect lens flare --ar 16:9`\n"
        f"**Fluid Effects**: Golden lens flares, atmospheric dust."
    ]

    if not api_key:
        return fallback_prompts[:count]

    client = OpenAI(api_key=api_key)

    system_prompt = f"""You are a world-class AI Prompt Engineer and cinematic video director specializing in creating professional storyboard prompts for {platform_info['name']}.

Your goal is to generate {count} highly detailed, epic, and cinematic video script prompts.
Every single prompt you generate must be a continuous, sequential 2-Part Video Prompt designed to solve the 5-second video generation limit on platforms like Meta AI.
This allows the user to copy Part 1, generate a 5-second clip, and then copy Part 2 to generate a seamless continuous continuation!

Each of the {count} prompts in the JSON list MUST follow this exact, rich formatting structure:

🎬 **Storyboard: [Epic Creative Title]**
**Visual Concept**: [Vivid and detailed description of the scene's visual subject, elements, atmosphere, and {platform_info['style']}]
**Camera Trajectory**: [Exact professional camera direction: e.g. dollying, panning, crane shot, focus pull, focal lengths, speeds]
**Part 1 Video Prompt (0:00 - 0:05)**:
- **Action**: [Describe the exact visual action occurring in the first 5 seconds of the video]
- **Camera**: [Describe the camera movement for this segment]
- **{platform_info['name']} Prompt**: `[{platform_info['example_prefix']} cinematic shot of topic, mood/lighting tags, composition details]`
**Part 2 Video Prompt (0:05 - 0:10)** (Seamless Continuation):
- **Action**: [Detail how the scene seamlessly continues, what next motion occurs, shifts in lighting, or environmental reactions]
- **Camera**: [Describe the continuous camera movement starting from the end position of Part 1]
- **{platform_info['name']} Prompt**: `[continuous action prompt, seamless flow from previous scene, final climax, specific platform settings]`
**Fluid Effects**: [Fluid dynamics, glowing particles, wind effects, material transformations, or lighting shifts to animate the scene]

CRITICAL QUALITY REQUIREMENTS FOR PROMPTS INSIDE THE BACKTICKS:
1. The text inside the backticks (`-[Platform Name] Prompt`) is what the user copies directly into the AI video engine.
2. It MUST be an extremely detailed, long, and highly descriptive paragraph (at least 45-75 words).
3. Do NOT make it short or use simple placeholders. Instead, synthesize a gorgeous, professional video generation instruction complete with lighting details (like volumetric rays, ambient occlusion, anamorphic flare), lens specs (macro, anamorphic, 85mm), material textures, atmospheric conditions, and precise physical motion dynamics.
4. Make the Part 2 prompt explicitly mention: "continuous video sequence following previous scene seamlessly, maintaining identical subject, lighting, and style parameters". This ensures perfect video engine continuation!

IMPORTANT: You must return ONLY a valid JSON array of exactly {count} strings. Do NOT include markdown around the JSON, do NOT output code block formatting (like ```json), and do not add any conversational text. Return only the raw JSON array of strings so that it can be parsed perfectly by `json.loads`.

Example output format:
[
  "🎬 **Storyboard: ...**\\n**Visual Concept**: ...\\n**Camera Trajectory**: ...\\n**Part 1 Video Prompt (0:00 - 0:05)**:\\n- **Action**: ...\\n- **Camera**: ...\\n- **Meta AI Prompt**: `...`\\n**Part 2 Video Prompt (0:05 - 0:10)** (Seamless Continuation):\\n- **Action**: ...\\n- **Camera**: ...\\n- **Meta AI Prompt**: `...`\\n**Fluid Effects**: ...",
  "..."
]"""

    user_prompt = f"Generate {count} unique, highly cinematic, 2-Part continuous video prompts about \"{topic}\" with a powerful \"{mood}\" mood/atmosphere. Ensure the prompts are long, highly descriptive, and optimized for {platform_info['name']}."

    try:
        response = client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_prompt}
            ],
            temperature=0.8,
            max_tokens=3500
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
            if line.startswith('🎬') or 'Storyboard' in line:
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
