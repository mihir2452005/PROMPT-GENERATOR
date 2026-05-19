
import os
from openai import OpenAI

def generate_ai_prompt(topic, mood):
    api_key = os.getenv('OPENAI_API_KEY')

    if not api_key:
        return f'Cinematic {topic} with {mood} atmosphere.'
    client = OpenAI(api_key=api_key)

    try:
        response = client.chat.completions.create(
            model='gpt-4.1-mini',
            messages=[
                {
                    'role': 'system',
                    'content': 'Generate cinematic AI prompts'
                },
                {
                    'role': 'user',
                    'content': f'Generate a prompt about {topic} in {mood} mood'
                }
            ]
        )

        return response.choices[0].message.content
    except Exception:
        # On API errors, return a simple fallback so frontend still works
        return f'Cinematic {topic} with {mood} atmosphere.'
