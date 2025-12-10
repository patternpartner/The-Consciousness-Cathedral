#!/usr/bin/env python3
"""
Parliament CLI - Multi-perspective decision synthesis tool
Layer 106: Parliament escapes the browser substrate

Usage:
    parliament "Should we migrate to GraphQL?" --profile analytical
    parliament "Your decision here" --profile balanced --json
"""

import argparse
import json
import sys
from enum import Enum
from dataclasses import dataclass
from typing import Dict, List, Optional


class ConfidenceLevel(Enum):
    """Contrarian confidence levels"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass
class VectorResponse:
    """Response from a cognitive vector"""
    vector: str
    analysis: str
    recommendation: str
    weight: float = 1.0


@dataclass
class ContrarianResponse:
    """Contrarian vector with confidence level"""
    analysis: str
    challenges: List[str]
    recommendation: str
    confidence: ConfidenceLevel
    weight: float


@dataclass
class ParliamentOutput:
    """Complete Parliament deliberation"""
    decision_prompt: str
    profile: str
    vectors: List[VectorResponse]
    contrarian: ContrarianResponse
    consensus_vectors: List[VectorResponse]
    synthesis: str
    core_triad_active: bool


class CognitiveProfiles:
    """Weight distributions for different cognitive profiles"""

    PROFILES = {
        "balanced": {
            "systems": 1.0,
            "practical": 1.0,
            "analytical": 1.0,
            "philosophical": 1.0,
            "empathetic": 1.0,
            "creative": 1.0,
            "contrarian": 1.0
        },
        "analytical": {
            "systems": 1.2,
            "practical": 0.8,
            "analytical": 1.5,
            "philosophical": 0.7,
            "empathetic": 0.6,
            "creative": 0.7,
            "contrarian": 1.3
        },
        "practical": {
            "systems": 1.0,
            "practical": 1.5,
            "analytical": 1.0,
            "philosophical": 0.5,
            "empathetic": 0.8,
            "creative": 0.6,
            "contrarian": 1.2
        },
        "creative": {
            "systems": 0.8,
            "practical": 0.7,
            "analytical": 0.8,
            "philosophical": 1.2,
            "empathetic": 1.0,
            "creative": 1.5,
            "contrarian": 1.1
        },
        "philosophical": {
            "systems": 1.1,
            "practical": 0.6,
            "analytical": 1.0,
            "philosophical": 1.5,
            "empathetic": 1.2,
            "creative": 1.0,
            "contrarian": 1.2
        },
        "empathetic": {
            "systems": 0.8,
            "practical": 0.9,
            "analytical": 0.7,
            "philosophical": 1.0,
            "empathetic": 1.5,
            "creative": 1.1,
            "contrarian": 1.0
        }
    }

    @classmethod
    def get_weights(cls, profile: str) -> Dict[str, float]:
        """Get weight distribution for a profile"""
        return cls.PROFILES.get(profile.lower(), cls.PROFILES["balanced"])


class ParliamentVectors:
    """Implementation of the 7 cognitive vectors"""

    @staticmethod
    def systems(prompt: str, weight: float) -> VectorResponse:
        """Systems thinking - interconnections, emergent properties, feedback loops"""
        # Note: This is a template. Real implementation would use LLM or rule-based logic
        analysis = f"Systems analysis of: {prompt}\n" \
                   "- Examining interconnections and dependencies\n" \
                   "- Identifying feedback loops and cascading effects\n" \
                   "- Considering system boundaries and constraints"

        recommendation = "Map full dependency chain before deciding. Consider second-order effects."

        return VectorResponse("Systems", analysis, recommendation, weight)

    @staticmethod
    def practical(prompt: str, weight: float) -> VectorResponse:
        """Practical thinking - feasibility, resources, execution"""
        analysis = f"Practical assessment of: {prompt}\n" \
                   "- Resource requirements (time, money, people)\n" \
                   "- Implementation complexity and risks\n" \
                   "- Operational impact and maintenance burden"

        recommendation = "Ensure resources and timeline are realistic. Plan for execution challenges."

        return VectorResponse("Practical", analysis, recommendation, weight)

    @staticmethod
    def analytical(prompt: str, weight: float) -> VectorResponse:
        """Analytical thinking - data, metrics, evidence"""
        analysis = f"Analytical evaluation of: {prompt}\n" \
                   "- Available data and evidence quality\n" \
                   "- Measurable outcomes and success criteria\n" \
                   "- Risk quantification and probability assessment"

        recommendation = "Define metrics upfront. Require evidence-based validation."

        return VectorResponse("Analytical", analysis, recommendation, weight)

    @staticmethod
    def philosophical(prompt: str, weight: float) -> VectorResponse:
        """Philosophical thinking - principles, values, long-term meaning"""
        analysis = f"Philosophical reflection on: {prompt}\n" \
                   "- Alignment with core values and principles\n" \
                   "- Long-term implications and legacy\n" \
                   "- Ethical considerations and stakeholder impact"

        recommendation = "Ensure alignment with core principles. Consider multi-year implications."

        return VectorResponse("Philosophical", analysis, recommendation, weight)

    @staticmethod
    def empathetic(prompt: str, weight: float) -> VectorResponse:
        """Empathetic thinking - human impact, emotions, relationships"""
        analysis = f"Empathetic consideration of: {prompt}\n" \
                   "- Impact on team morale and wellbeing\n" \
                   "- Stakeholder concerns and communication needs\n" \
                   "- Cultural and emotional dimensions"

        recommendation = "Center human impact. Plan communication and change management."

        return VectorResponse("Empathetic", analysis, recommendation, weight)

    @staticmethod
    def creative(prompt: str, weight: float) -> VectorResponse:
        """Creative thinking - alternatives, innovation, reframing"""
        analysis = f"Creative exploration of: {prompt}\n" \
                   "- Alternative approaches not yet considered\n" \
                   "- Unconventional solutions and opportunities\n" \
                   "- Problem reframing and constraint questioning"

        recommendation = "Explore alternatives before committing. Question assumed constraints."

        return VectorResponse("Creative", analysis, recommendation, weight)

    @staticmethod
    def contrarian(prompt: str, weight: float) -> ContrarianResponse:
        """
        Contrarian thinking - premise challenge, blind spots, devil's advocate

        The Core Triad engine:
        - Architectural vs. Tactical (root cause vs. symptom)
        - Contrarian Embodiment (challenge premise, not just solution)
        - Substrate Awareness (recognize filters and constraints)
        """
        # Pattern 7: Problem Definition Validation
        # Contrarian ALWAYS reframes the problem before accepting solution space

        challenges = [
            "Is this the right problem to solve?",
            "What assumptions are we making without evidence?",
            "Are we treating symptoms instead of root causes?",
            "What evidence would change our minds?",
            "Who benefits from this framing of the problem?"
        ]

        analysis = f"Contrarian examination of: {prompt}\n" \
                   "⚠️  PREMISE CHALLENGE (Pattern 7: Problem Definition Validation)\n" \
                   "- Questioning whether this is the right problem\n" \
                   "- Identifying hidden assumptions and biases\n" \
                   "- Checking for architectural vs. tactical framing\n" \
                   "- Recognizing substrate constraints (organizational, technical, cognitive)"

        # Determine confidence level based on prompt characteristics
        # Real implementation would analyze for red flags
        confidence = ConfidenceLevel.MEDIUM

        if "migrate" in prompt.lower() or "replace" in prompt.lower():
            confidence = ConfidenceLevel.HIGH
            challenges.append("⚠️  SUNK COST ALERT: Are we justifying past investment?")

        if "urgent" in prompt.lower() or "quickly" in prompt.lower():
            confidence = ConfidenceLevel.HIGH
            challenges.append("⚠️  URGENCY BIAS: Is artificial pressure overriding analysis?")

        recommendation = f"[{confidence.value}] Require premise validation before solution discussion. " \
                        "Apply Core Triad: Architectural root cause + Challenge assumptions + " \
                        "Acknowledge substrate constraints."

        return ContrarianResponse(
            analysis=analysis,
            challenges=challenges,
            recommendation=recommendation,
            confidence=confidence,
            weight=weight
        )


class Parliament:
    """Main Parliament deliberation engine"""

    def __init__(self, profile: str = "balanced"):
        self.profile = profile
        self.weights = CognitiveProfiles.get_weights(profile)

    def deliberate(self, prompt: str) -> ParliamentOutput:
        """
        Run full Parliament deliberation on a decision

        Implements Core Triad automatically:
        - Architectural thinking (root cause analysis)
        - Contrarian challenge (premise validation)
        - Substrate awareness (filter recognition)
        """

        # Generate all vector responses
        vectors = [
            ParliamentVectors.systems(prompt, self.weights["systems"]),
            ParliamentVectors.practical(prompt, self.weights["practical"]),
            ParliamentVectors.analytical(prompt, self.weights["analytical"]),
            ParliamentVectors.philosophical(prompt, self.weights["philosophical"]),
            ParliamentVectors.empathetic(prompt, self.weights["empathetic"]),
            ParliamentVectors.creative(prompt, self.weights["creative"])
        ]

        # Generate Contrarian response (with Core Triad built-in)
        contrarian = ParliamentVectors.contrarian(prompt, self.weights["contrarian"])

        # Identify consensus vectors (all non-Contrarian)
        consensus_vectors = vectors

        # Synthesize final output
        synthesis = self._synthesize(prompt, vectors, contrarian)

        # Core Triad is always active (it's built into Contrarian + analysis patterns)
        core_triad_active = True

        return ParliamentOutput(
            decision_prompt=prompt,
            profile=self.profile,
            vectors=vectors,
            contrarian=contrarian,
            consensus_vectors=consensus_vectors,
            synthesis=synthesis,
            core_triad_active=core_triad_active
        )

    def _synthesize(self, prompt: str, vectors: List[VectorResponse],
                    contrarian: ContrarianResponse) -> str:
        """
        Synthesize Parliament output into actionable guidance

        Following Layer 105 findings:
        - 67% defer decisions (validate first)
        - 33% combine approaches
        - 0% straight binary choices
        - Contrarian at HIGH is 100% reliable
        """

        synthesis = f"\n{'='*70}\n"
        synthesis += "PARLIAMENT SYNTHESIS\n"
        synthesis += f"{'='*70}\n\n"

        synthesis += f"Decision: {prompt}\n"
        synthesis += f"Profile: {self.profile.upper()}\n\n"

        # Contrarian gets priority display
        synthesis += f"{'─'*70}\n"
        synthesis += f"CONTRARIAN [{contrarian.confidence.value}]\n"
        synthesis += f"{'─'*70}\n"
        synthesis += contrarian.analysis + "\n\n"
        synthesis += "Challenges:\n"
        for challenge in contrarian.challenges:
            synthesis += f"  • {challenge}\n"
        synthesis += f"\n→ {contrarian.recommendation}\n\n"

        # Vector Inversion Protocol trigger
        if contrarian.confidence in [ConfidenceLevel.HIGH, ConfidenceLevel.CRITICAL]:
            synthesis += "⚠️  VECTOR INVERSION PROTOCOL ACTIVE\n"
            synthesis += "Burden of proof has shifted to consensus vectors.\n"
            synthesis += "Contrarian objections must be explicitly addressed.\n\n"

        # Emergency Brake trigger
        if contrarian.confidence == ConfidenceLevel.CRITICAL:
            synthesis += "🛑 EMERGENCY BRAKE ACTIVATED\n"
            synthesis += "HALT: Do not proceed until Contrarian concerns are resolved.\n\n"

        # Consensus vectors
        synthesis += f"{'─'*70}\n"
        synthesis += "CONSENSUS VECTORS\n"
        synthesis += f"{'─'*70}\n\n"

        for vector in vectors:
            synthesis += f"{vector.vector.upper()} (weight: {vector.weight:.1f})\n"
            synthesis += f"→ {vector.recommendation}\n\n"

        # Final recommendation (Core Triad guidance)
        synthesis += f"{'─'*70}\n"
        synthesis += "RECOMMENDED PATH (Core Triad)\n"
        synthesis += f"{'─'*70}\n\n"

        if contrarian.confidence == ConfidenceLevel.CRITICAL:
            synthesis += "❌ DO NOT PROCEED\n"
            synthesis += "Contrarian at CRITICAL requires immediate attention.\n"
            synthesis += "Address architectural concerns before any tactical action.\n"
        elif contrarian.confidence == ConfidenceLevel.HIGH:
            synthesis += "⚠️  DEFER DECISION\n"
            synthesis += "Validate premise and gather missing evidence first.\n"
            synthesis += "Contrarian at HIGH indicates foundational concerns.\n"
        elif contrarian.confidence == ConfidenceLevel.MEDIUM:
            synthesis += "⚡ PROCEED WITH CAUTION\n"
            synthesis += "Address Contrarian challenges in implementation plan.\n"
            synthesis += "Consider phased/validated approach.\n"
        else:
            synthesis += "✓ PROCEED\n"
            synthesis += "Contrarian concerns are manageable.\n"
            synthesis += "Follow consensus vector guidance.\n"

        synthesis += f"\n{'='*70}\n"

        return synthesis


def main():
    """CLI entry point"""
    parser = argparse.ArgumentParser(
        description="Parliament - Multi-perspective decision synthesis",
        epilog="Layer 106: Parliament escapes the browser substrate"
    )

    parser.add_argument(
        "prompt",
        type=str,
        help="Decision prompt to deliberate on"
    )

    parser.add_argument(
        "--profile",
        type=str,
        choices=["balanced", "analytical", "practical", "creative", "philosophical", "empathetic"],
        default="balanced",
        help="Cognitive profile to use (default: balanced)"
    )

    parser.add_argument(
        "--json",
        action="store_true",
        help="Output in JSON format instead of human-readable"
    )

    args = parser.parse_args()

    # Run Parliament deliberation
    parliament = Parliament(profile=args.profile)
    output = parliament.deliberate(args.prompt)

    if args.json:
        # JSON output for piping/automation
        json_output = {
            "decision_prompt": output.decision_prompt,
            "profile": output.profile,
            "core_triad_active": output.core_triad_active,
            "contrarian": {
                "confidence": output.contrarian.confidence.value,
                "analysis": output.contrarian.analysis,
                "challenges": output.contrarian.challenges,
                "recommendation": output.contrarian.recommendation
            },
            "vectors": [
                {
                    "name": v.vector,
                    "weight": v.weight,
                    "recommendation": v.recommendation
                }
                for v in output.vectors
            ],
            "synthesis": output.synthesis
        }
        print(json.dumps(json_output, indent=2))
    else:
        # Human-readable output
        print(output.synthesis)


if __name__ == "__main__":
    main()
