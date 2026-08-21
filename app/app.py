from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200

@app.route('/agent/ask', methods=['POST'])
def ask():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    if not data.get('question'):
        return jsonify({"error": "No question provided"}), 400
    if not data.get('student_id'):
        return jsonify({"error": "No student_id provided"}), 400
        
    return jsonify(
        { 
            "answer": f"Recibí tu pregunta: {data['question']}", 
            "sources": ["mock_source"], 
            "needs_approval": True
        }
    ), 200

if __name__ == '__main__':
    app.run(debug=True)
    app.run(host='0.0.0.0', port=5000)