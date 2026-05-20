import os
import json
import random
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

def generate_procedural_prompts(topic, mood, platform, count):
    """
    Generates beautiful, highly detailed, procedurally randomized 2-part cinematic 
    video prompts. This acts as the ultimate fallback engine when OpenAI quota is exhausted.
    Ensures that every generation round produces completely unique prompt details!
    """
    platform_info = PLATFORM_GUIDES.get(platform, PLATFORM_GUIDES['general'])
    engine_name = platform_info['name']
    prefix = "Imagine a video of: " if platform == 'meta_ai' else platform_info['example_prefix']
    
    # Large arrays of photorealistic descriptive elements to blend procedurally
    concepts = [
        "A grand visual masterpiece presenting {topic} under breathtaking volumetric {mood} conditions.",
        "An intimate visual exploration focusing on the fine, microscopic details and physics of {topic} in a deep {mood} theme.",
        "An epic cinematic landscape centered around {topic}, glowing with rich {mood} color tones.",
        "A stylized, artistic presentation of {topic} capturing fluid motion and highly atmospheric {mood} weather effects.",
        "A futuristic, dramatic vision of {topic} wrapped in volumetric lighting beams and rich {mood} shadows."
    ]

    p1_actions = [
        "cinematic close-up capturing {topic} illuminated by sweeping light leaks as ambient {mood} glows slowly filter across the lens.",
        "extreme close-up on the complex, glistening textures of {topic} with tiny dust motes floating lazily in a {mood} spotlight.",
        "hyper-detailed slow-motion focus on the central subject of {topic} as swirling volumetric mist wraps elegantly around the base.",
        "low-angle establishing view highlighting the silhouette of {topic} contrasting beautifully against a moody {mood} sunset.",
        "dynamic slow-tracking shot discovering {topic} amidst a dark, atmospheric environment lit by neon {mood} volumetric beams."
    ]

    p1_cameras = [
        "Smooth 3D gimbal tracking pan moving slowly right to left.",
        "Slow, delicate forward push along the Z-axis with ultra-shallow depth of field.",
        "Static locked-off composition with organic camera lens vibrations.",
        "Sweeping 35mm wide-angle dolly-in establishing perspective.",
        "Slow focal transition pulling from background blur into macro clarity."
    ]

    p2_actions = [
        "The scene undergoes a dramatic scale change as {topic} animates, sending bright glowing embers and concrete particles flying in bullet-time slow motion.",
        "Focus smoothly transitions as a pristine, clear water droplet slides off {topic}, refracting the rich {mood} gradient sky.",
        "Volumetric god-rays pierce through dark clouds, dynamically lighting up {topic} and casting long, highly detailed ray-traced shadows.",
        "The camera reaches its maximum height, showcasing the breathtaking expanse of the sunset casting gold and violet hues over {topic}.",
        "A sudden change in physical dynamics occurs, making floating particles around {topic} freeze in mid-air in a floating spherical gravity field."
    ]

    p2_cameras = [
        "Seamless continuous crane shot pulling back and rising upwards in a grand sweeping motion.",
        "Slow focal transition with a gentle 360-degree camera rotation around the subject.",
        "Dynamic tracking dolly-out maintaining identical focus and physical alignment.",
        "Elegant horizontal pan towards the blinding glowing horizon.",
        "Slow, majestic push forward through the clearing atmospheric haze."
    ]

    render_modifiers = [
        "Unreal Engine 5 render style, 8k resolution, ray-traced ambient occlusion, soft dramatic depth of field, golden anamorphic lens flares, highly photorealistic --ar 16:9",
        "ultra-high-definition 85mm camera lens detail, IMAX aspect ratio, vivid color grading, soft volumetric illumination, photorealistic textures --ar 16:9",
        "hyper-realistic material shaders, extreme macro rendering, chromatic aberration, ray-traced reflections, highly polished cinematic scaling --ar 16:9",
        "bullet-time super slow-motion physics, volumetric fog shaders, soft twilight color transitions, cinematic masterpiece level detail --ar 16:9"
    ]

    fluid_effects = [
        "Volumetric clouds, raytraced reflections, dynamic atmospheric weather simulation.",
        "Glistening wet trails, liquid physics simulation, soft cinematic focus-pull.",
        "Airborne moisture particles, golden lens flares, ambient volumetric fog.",
        "High-velocity concrete debris, glowing particle systems, bullet-time slow-motion.",
        "Volumetric god-rays, gradient atmospheric twilight, long detailed shadows."
    ]

    storyboards = []
    
    # Shuffle lists to maximize randomness
    random.shuffle(concepts)
    random.shuffle(p1_actions)
    random.shuffle(p1_cameras)
    random.shuffle(p2_actions)
    random.shuffle(p2_cameras)
    random.shuffle(render_modifiers)
    random.shuffle(fluid_effects)

    titles = [
        "The Epic Opening", "The Micro & Macro Focus", "The Atmospheric Transition",
        "The Dynamic Action Run", "The Cinematic Horizon", "The Ethereal Glow",
        "The Volumetric Rise", "The Temporal Flow", "The Infinite Sequence"
    ]
    random.shuffle(titles)

    for i in range(count):
        title = titles[i % len(titles)]
        concept = concepts[i % len(concepts)].format(topic=topic, mood=mood)
        p1_act = p1_actions[i % len(p1_actions)].format(topic=topic, mood=mood)
        p1_cam = p1_cameras[i % len(p1_cameras)]
        p2_act = p2_actions[i % len(p2_actions)].format(topic=topic, mood=mood)
        p2_cam = p2_cameras[i % len(p2_cameras)]
        modifier = render_modifiers[i % len(render_modifiers)]
        fluid = fluid_effects[i % len(fluid_effects)]
        
        # Build 100-word highly descriptive paragraph prompts
        prompt1_paragraph = f"{prefix}A breathtaking, highly detailed {p1_act} The camera executes a {p1_cam.lower()} {modifier}"
        prompt2_paragraph = f"{prefix}Seamless continuous video sequence following previous shot, maintaining identical subject, lighting, and style parameters. {p2_act} The camera completes a {p2_cam.lower()} {modifier}"
        
        sb = (
            f"🎬 **Storyboard: {title}**\n"
            f"**Visual Concept**: {concept}\n"
            f"**Camera Trajectory**: {p1_cam} transitioning to {p2_cam.lower()}\n"
            f"**Part 1 Video Prompt (0:00 - 0:05)**:\n"
            f"- **Action**: Cinematic view showing {p1_act}\n"
            f"- **Camera**: {p1_cam}\n"
            f"- **{engine_name} Prompt**: `{prompt1_paragraph}`\n"
            f"**Part 2 Video Prompt (0:05 - 0:10)** (Seamless Continuation):\n"
            f"- **Action**: {p2_act}\n"
            f"- **Camera**: {p2_cam}\n"
            f"- **{engine_name} Prompt**: `{prompt2_paragraph}`\n"
            f"**Fluid Effects**: {fluid}"
        )
        storyboards.append(sb)

    return storyboards

def generate_ai_prompts(topic, mood, platform='general', count=5):
    """Generate multiple high-quality, story-driven, timeline-based video scripts optimized for a specific platform."""
    api_key = os.getenv('OPENAI_API_KEY')
    platform_info = PLATFORM_GUIDES.get(platform, PLATFORM_GUIDES['general'])

    if not api_key:
        print("[WARNING] OPENAI_API_KEY environment variable is empty. Launching high-quality Procedural Fallback Generator...")
        return ensure_meta_ai_prefix(generate_procedural_prompts(topic, mood, platform, count), platform)

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

        print("[WARNING] OpenAI response parsing failed. Activating Dynamic Procedural Fallback Engine...")
        return ensure_meta_ai_prefix(generate_procedural_prompts(topic, mood, platform, count), platform)

    except Exception as e:
        print(f"[CRITICAL ERROR] OpenAI generation failed: {str(e)}")
        print("[SYSTEM NOTICE] Automatically falling back to our high-fidelity, randomized Procedural Prompt Generation engine...")
        # Fallback on any error (like RateLimit quota 429) to ensure uniquely generated dynamic prompts
        return ensure_meta_ai_prefix(generate_procedural_prompts(topic, mood, platform, count), platform)

def get_supported_platforms():
    """Return list of supported platforms for the frontend dropdown."""
    return [
        {'id': key, 'name': info['name']}
        for key, info in PLATFORM_GUIDES.items()
    ]
