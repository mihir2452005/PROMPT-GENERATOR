from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import os
import base64
from huggingface_hub import InferenceClient

video_bp = Blueprint('video', __name__)

@video_bp.route('/generate-video', methods=['POST'])
@jwt_required()
def generate_video():
    data = request.get_json() or {}
    prompt = data.get('prompt')
    
    if not prompt:
        return jsonify({'error': 'Prompt is required'}), 400

    hf_token = os.getenv('HF_TOKEN')
    if not hf_token:
        return jsonify({'error': 'Hugging Face API token (HF_TOKEN) is not configured on the server. Please add it to your environment.'}), 500

    try:
        # Connect to a top-tier free open-source video model
        client = InferenceClient(api_key=hf_token)
        
        # We query the spectacular LTX-Video model
        video_bytes = client.text_to_video(
            prompt,
            model="Lightricks/LTX-Video"
        )
        
        # Convert binary MP4 bytes to a Base64 string so frontend can render it inline instantly
        encoded_video = base64.b64encode(video_bytes).decode('utf-8')
        video_url = f"data:video/mp4;base64,{encoded_video}"
        
        return jsonify({'videoUrl': video_url}), 200
        
    except Exception as e:
        print("Hugging Face Video Generation Error:", str(e))
        return jsonify({'error': f"Hugging Face server is busy or compiling: {str(e)}"}), 500
