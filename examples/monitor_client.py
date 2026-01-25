#!/usr/bin/env python3
import requests
import json
from typing import Optional, Dict, Any

class CathedralClient:
    def __init__(self, api_base: str = "http://localhost:3000"):
        self.api_base = api_base
        self.session_id: Optional[str] = None

    def create_session(self) -> str:
        res = requests.post(f"{self.api_base}/session")
        data = res.json()
        self.session_id = data["sessionId"]
        return self.session_id

    def analyze(self, text: str, end_turn: bool = False) -> Dict[str, Any]:
        if not self.session_id:
            self.create_session()

        res = requests.post(
            f"{self.api_base}/analyze",
            json={"sessionId": self.session_id, "text": text, "endTurn": end_turn}
        )
        return res.json()

    def get_history(self) -> Dict[str, Any]:
        if not self.session_id:
            return None

        res = requests.get(f"{self.api_base}/history", params={"sessionId": self.session_id})
        return res.json()

def demo():
    client = CathedralClient()

    print("╔═══════════════════════════════════════════════╗")
    print("║  Cathedral Monitor Python Client Demo        ║")
    print("╚═══════════════════════════════════════════════╝\n")

    session_id = client.create_session()
    print(f"Session created: {session_id}\n")

    turns = [
        "We should deploy this caching system immediately. It's clearly the optimal solution.",
        "Actually, I'm uncertain about edge cases. The substrate might be filtering my perception.",
        "Let me be specific: If error rate exceeds 5%, we abort. If cache exceeds 90%, we scale."
    ]

    for i, turn_text in enumerate(turns, 1):
        print(f"Turn {i}:")
        print(f'"{turn_text[:70]}..."\n')

        result = client.analyze(turn_text, end_turn=True)

        analysis = result["analysis"]
        print(f"Uncertainty: {analysis['uncertaintyVerdict']}")
        print(f"Substrate: {analysis['substrateVerdict']}")
        print(f"Sovereignty: {int(analysis['sovereigntyScore'] * 100)}%")

        if result.get("trajectory"):
            traj = result["trajectory"]
            print(f"\nTrajectory Pattern: {traj['pattern']}")
            print(f"Uncertainty Trend: {traj['trends']['uncertainty']['trend']}")

        print("\n" + "─" * 50 + "\n")

    history = client.get_history()
    print("Full Conversation Analysis:")
    print(f"Pattern: {history['trajectory']['pattern']}")
    print(f"Total Turns: {history['trajectory']['turns']}")
    print("\nEvolution:")
    for metric, data in history['trajectory']['trends'].items():
        change = data['change']
        sign = '+' if change > 0 else ''
        print(f"  {metric}: {data['trend']} ({sign}{int(change * 100)}%)")

if __name__ == "__main__":
    try:
        demo()
    except requests.exceptions.ConnectionError:
        print("Error: Cannot connect to monitor server")
        print("\nMake sure monitor server is running:")
        print("  node monitor-server.js")
        exit(1)
    except Exception as e:
        print(f"Error: {e}")
        exit(1)
