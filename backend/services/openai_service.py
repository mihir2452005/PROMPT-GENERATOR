
import os
import json
from openai import OpenAI

PLATFORM_GUIDES = {
    'meta_ai': {
        'name': 'Meta AI (Imagine)',
        'style': 'highly descriptive visual sequences, cinematic framing, photo-realistic rendering, and dynamic lighting modifiers.',
        'example_prefix': 'Imagine a video of: a detailed cinematic sequence showing'
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

def ensure_meta_ai_prefix(prompts, platform):
    if platform == 'meta_ai':
        processed = []
        for p in prompts:
            # Prepend Imagine a video of: prefix inside backticks for Meta AI
            p_new = p.replace("- **Meta AI (Imagine) Prompt**: `", "- **Meta AI (Imagine) Prompt**: `Imagine a video of: ")
            p_new = p_new.replace("- **Meta AI/Engine Prompt**: `", "- **Meta AI/Engine Prompt**: `Imagine a video of: ")
            
            # Clean redundant duplicates and old prefixes
            p_new = p_new.replace("`Imagine a video of: Imagine a video of: ", "`Imagine a video of: ")
            p_new = p_new.replace("`Imagine a video of: Imagine a video of ", "`Imagine a video of: ")
            p_new = p_new.replace("`Imagine a video of: imagine a video of: ", "`Imagine a video of: ")
            p_new = p_new.replace("`Imagine a video of: imagine a video of ", "`Imagine a video of: ")
            p_new = p_new.replace("`Imagine a video of: Animate: ", "`Imagine a video of: ")
            p_new = p_new.replace("`Imagine a video of: Animate ", "`Imagine a video of: ")
            p_new = p_new.replace("`Imagine a video of: animate: ", "`Imagine a video of: ")
            p_new = p_new.replace("`Imagine a video of: animate ", "`Imagine a video of: ")
            processed.append(p_new)
        return processed
    return prompts

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
        f"- **Meta AI/Engine Prompt**: `Imagine a video of: An epic, photorealistic cinematic close-up shot capturing {topic} illuminated by warm, sweeping volumetric {mood} light beams. Slow-moving light leaks and golden anamorphic lens flares slice elegantly across an ultra-high-definition 85mm camera lens. The atmosphere is filled with micro-fine floating dust motes glowing in the volumetric rays. Ultra-shallow depth of field, sharp textures, Unreal Engine 5 render style, 8k resolution, cinematic scale, high-end production --ar 16:9`\n"
        f"**Part 2 Video Prompt (0:05 - 0:10)** (Seamless Continuation):\n"
        f"- **Action**: The camera pulls back dramatically, seamlessly revealing the entire glowing expanse of the setting under changing lighting transitions.\n"
        f"- **Camera**: Dynamic crane shot rising up and back, maintaining continuous subject focus.\n"
        f"- **Meta AI/Engine Prompt**: `Imagine a video of: Seamless continuous video sequence following previous close-up shot. The camera dolly-outs smoothly in a grand sweeping crane motion to fully reveal {topic} standing majestically amidst an expansive, jaw-dropping cinematic landscape matching the powerful {mood} mood. The glowing sunset changes color dynamic in real-time, casting extremely long, detailed ray-traced shadows across the damp ground. Photorealistic, 8k resolution, IMAX ratio --ar 16:9`\n"
        f"**Fluid Effects**: Volumetric clouds, raytraced reflections.",

        f"🎬 **Storyboard: The Micro & Macro Focus**\n"
        f"**Visual Concept**: An intimate view focusing on the fine textures of {topic} reflecting a {mood} ambient palette.\n"
        f"**Camera Trajectory**: Focus pull transitioning from abstract background bokeh into macro level clarity.\n"
        f"**Part 1 Video Prompt (0:00 - 0:05)**:\n"
        f"- **Action**: Extreme close-up of {topic} surfaces, catching soft circular light rays bouncing off organic edges.\n"
        f"- **Camera**: Slow, delicate forward push along the Z-axis.\n"
        f"- **Meta AI/Engine Prompt**: `Imagine a video of: A breathtaking extreme macro focus-pull shot exploring the hyper-detailed fine surface textures of {topic} with absolute precision. The soft ambient lighting glows with a serene {mood} aesthetic, creating gorgeous, soft circular bokeh reflections in the background. The camera moves forward delicately on a microscopic scale, highlighting crisp edges, complex material patterns, and soft chromatic aberration. Photorealistic, ray-traced ambient occlusion, masterfully detailed, 8k resolution --ar 16:9`\n"
        f"**Part 2 Video Prompt (0:05 - 0:10)** (Seamless Continuation):\n"
        f"- **Action**: Focus smoothly shifts from the front texture to reveal a larger moving subject or water droplet sliding off {topic}.\n"
        f"- **Camera**: Slow focal transition with a gentle camera rotation.\n"
        f"- **Meta AI/Engine Prompt**: `Imagine a video of: Seamless continuous video sequence continuing the previous macro shot. The focus pulls smoothly backward to reveal a crystal-clear, highly detailed water droplet sliding elegantly down the surface of {topic}. The droplet refracts the colorful {mood} sky beautifully, and leaves a glistening wet trail behind it with realistic fluid physics. The camera orbits gently with 360-degree rotation. Super slow-motion, liquid physics simulation, hyper-realistic, 8k resolution --ar 16:9`\n"
        f"**Fluid Effects**: Water droplet simulation, cinematic focus-pull.",

        f"🎬 **Storyboard: The Atmospheric Transition**\n"
        f"**Visual Concept**: A dynamic sequence showcasing {topic} undergoing a magical environmental transition reflecting the {mood} theme.\n"
        f"**Camera Trajectory**: Static tripod position with sweeping panning movement.\n"
        f"**Part 1 Video Prompt (0:00 - 0:05)**:\n"
        f"- **Action**: The scene starts with {topic} shrouded in deep, heavy {mood} shadows, mist swirling at the base.\n"
        f"- **Camera**: Static locked-off composition with subtle camera vibrations.\n"
        f"- **Meta AI/Engine Prompt**: `Imagine a video of: An atmospheric, dark cinematic shot showing {topic} shrouded in heavy, dense, volumetric {mood} fog and swirling low-lying mist. The locked-off tripod camera captures subtle environmental wind vibrations, making the mist twist and curl realistically around the base of {topic}. Shadowy, moody lighting highlights fine moisture textures on the surface. Hyper-realistic fog physics, volumetric illumination, 8k resolution, cinematic masterpiece --ar 16:9`\n"
        f"**Part 2 Video Prompt (0:05 - 0:10)** (Seamless Continuation):\n"
        f"- **Action**: Mist begins to thin rapidly as powerful glowing light rays pierce through the clouds, lighting up {topic}.\n"
        f"- **Camera**: Slow tracking dolly-in through the thinning haze.\n"
        f"- **Meta AI/Engine Prompt**: `Imagine a video of: Seamless continuous video sequence following the previous atmospheric shot. The dense mist begins to thin rapidly as dramatic, bright volumetric god-rays pierce through dark clouds, dynamically illuminating {topic} with brilliant glowing highlights. The camera tracks forward in a slow, elegant dolly motion through the vanishing haze, capturing millions of glowing airborne moisture particles. Dynamic atmospheric weather simulation, cinematic masterpiece, 8k resolution --ar 16:9`\n"
        f"**Fluid Effects**: Realistic mist simulation, particle wind.",

        f"🎬 **Storyboard: The Dynamic Action Run**\n"
        f"**Visual Concept**: An epic, high-energy action tracking shot centered around {topic} with a powerful, cinematic {mood} undertone.\n"
        f"**Camera Trajectory**: High speed horizontal tracking shot alongside the main subject.\n"
        f"**Part 1 Video Prompt (0:00 - 0:05)**:\n"
        f"- **Action**: Energetic movement begins instantly, sparks and dust flying off {topic} as it animates into action.\n"
        f"- **Camera**: Fast tracking shot moving horizontally.\n"
        f"- **Meta AI/Engine Prompt**: `Imagine a video of: A high-speed, dynamic tracking shot running alongside {topic} as it bursts into powerful, high-energy action. Glowing orange sparks, concrete dust, and atmospheric debris fly off {topic} in all directions, captured with realistic motion blur and high velocity. The scene is illuminated by dramatic neon {mood} spotlights in a dark industrial warehouse. Hyper-realistic particle physics, high-speed camera, 8k resolution, IMAX aspect ratio --ar 16:9`\n"
        f"**Part 2 Video Prompt (0:05 - 0:10)** (Seamless Continuation):\n"
        f"- **Action**: A sudden slow-motion drop where all sparks freeze in the air in bullet-time around {topic}.\n"
        f"- **Camera**: Orbiting 360-degree rotational camera movement in super slow motion.\n"
        f"- **Meta AI/Engine Prompt**: `Imagine a video of: Seamless continuous video sequence following the previous high-speed tracking shot. The high-speed action instantly drops into a super slow-motion bullet-time sequence. The glowing sparks and debris freeze in mid-air in a perfect floating sphere around {topic}. The camera orbits in a smooth, high-fidelity 360-degree rotation showing the dynamic depth of the frozen particles. Photorealistic, 8k resolution, cinematic masterpiece --ar 16:9`\n"
        f"**Fluid Effects**: High-speed particle system, custom bullet-time simulation.",

        f"🎬 **Storyboard: The Cinematic Horizon**\n"
        f"**Visual Concept**: A highly emotional, artistic visualization of {topic} that brings out a deep, lingering {mood} feeling.\n"
        f"**Camera Trajectory**: High vertical rise transitioning into a peaceful sweeping horizon.\n"
        f"**Part 1 Video Prompt (0:00 - 0:05)**:\n"
        f"- **Action**: Close silhouette of {topic} resting against a gorgeous, sweeping gradient background of {mood} sky.\n"
        f"- **Camera**: Slow, rhythmic vertical crane rising upwards.\n"
        f"- **Meta AI/Engine Prompt**: `Imagine a video of: A low-angle close-up silhouette shot of {topic} resting peacefully against an expansive, gorgeous background sky painted in cinematic, gradient HSL colors of {mood}. The camera rises vertically in a slow, highly rhythmic crane motion, capturing majestic volumetric light leaks that shimmer dynamically. Anamorphic lens flare, photorealistic, 8k resolution, cinematic aesthetic --ar 16:9`\n"
        f"**Part 2 Video Prompt (0:05 - 0:10)** (Seamless Continuation):\n"
        f"- **Action**: The camera reaches the peak of the crane, fully capturing a breathtaking sunset/sunrise casting long gold shadows across the horizon.\n"
        f"- **Camera**: Slow, elegant panning shot towards the sun.\n"
        f"- **Meta AI/Engine Prompt**: `Imagine a video of: Seamless continuous video sequence following the previous crane shot. The camera reaches the peak of its crane height, smoothly transitioning into a slow, elegant panning shot facing the blinding glowing sun over the horizon. The horizon casts a warm golden hue over the entire setting, creating long, beautifully detailed shadows. Cinematic lens flare, atmospheric haze, photorealistic, 8k resolution --ar 16:9`\n"
        f"**Fluid Effects**: Golden lens flares, atmospheric dust."
    ]

    if not api_key:
        return ensure_meta_ai_prefix(fallback_prompts[:count], platform)

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
2. It MUST be an extremely detailed, immersive, and highly descriptive paragraph of 90 to 150 words.
3. Make it a photorealistic cinematic masterpiece. Detail exact physical textures, volumetric global lighting, ray-traced shadows, complex physics simulations, lens details (anamorphic flare, shallow depth of field, 8k resolution, IMAX cinematic aspect ratio), and weather/atmospheric conditions.
4. Use rich adjectives and active verbs that Meta AI can easily parse to generate high-fidelity, fluid video clips.
5. Make the Part 2 prompt explicitly mention: "continuous video sequence following previous scene seamlessly, maintaining identical subject, lighting, and style parameters". This ensures perfect video engine continuation!
6. **Strict Trigger Rule for Meta AI**: If the platform is Meta AI (Imagine), the text inside the backticks **MUST** start with the prefix `Imagine a video of: ` (e.g. `Imagine a video of: a detailed cinematic sequence showing...`). This is a strict functional mandate; without the word "video" in the primary phrase "Imagine a video of", Meta AI defaults to producing a static image instead of a moving clip. Prepending "Imagine a video of: " forces instant direct video execution perfectly!

IMPORTANT: You must return ONLY a valid JSON array of exactly {count} strings. Do NOT include markdown around the JSON, do NOT output code block formatting (like ```json), and do not add any conversational text. Return only the raw JSON array of strings so that it can be parsed perfectly by `json.loads`.

Example output format:
[
  "🎬 **Storyboard: ...**\\n**Visual Concept**: ...\\n**Camera Trajectory**: ...\\n**Part 1 Video Prompt (0:00 - 0:05)**:\\n- **Action**: ...\\n- **Camera**: ...\\n- **Meta AI Prompt**: `...`\\n**Part 2 Video Prompt (0:05 - 0:10)** (Seamless Continuation):\\n- **Action**: ...\\n- **Camera**: ...\\n- **Meta AI Prompt**: `...`\\n**Fluid Effects**: ...",
  "..."
]"""

    user_prompt = f"Generate {count} unique, highly cinematic, 2-Part continuous video prompts about \"{topic}\" with a powerful \"{mood}\" mood/atmosphere. Ensure the prompts are extremely long, highly descriptive, photorealistic masterpieces, and optimized for {platform_info['name']}."

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

        raw_content = response.choices[0].message.content
        content = raw_content.strip() if raw_content else ""
        
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
                return ensure_meta_ai_prefix(prompts[:count], platform)
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
            return ensure_meta_ai_prefix(prompts[:count], platform)
        
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
            return ensure_meta_ai_prefix(valid_prompts[:count], platform)

        # Last resort: return the fallback prompts so user gets a pristine 5-card experience
        return ensure_meta_ai_prefix(fallback_prompts[:count], platform)

    except Exception as e:
        # Fallback on any error to ensure uninterrupted high-quality user experience
        return ensure_meta_ai_prefix(fallback_prompts[:count], platform)

def get_supported_platforms():
    """Return list of supported platforms for the frontend dropdown."""
    return [
        {'id': key, 'name': info['name']}
        for key, info in PLATFORM_GUIDES.items()
    ]
