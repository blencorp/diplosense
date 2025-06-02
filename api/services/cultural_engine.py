from typing import Dict, List, Any

class CulturalEngine:
    def __init__(self):
        self.cultural_rules = {
            "american": {
                "communication_style": "direct",
                "directness_score": 0.8,
                "formality_level": "informal",
                "characteristics": ["direct communication", "time-conscious", "individual-focused"],
                "negotiation_patterns": ["quick decision-making", "explicit agreements", "focus on facts"]
            },
            "japanese": {
                "communication_style": "indirect",
                "directness_score": 0.2,
                "formality_level": "formal",
                "characteristics": ["consensus-building", "non-verbal communication", "relationship-focused"],
                "negotiation_patterns": ["long-term perspective", "implicit understanding", "harmony preservation"]
            },
            "german": {
                "communication_style": "direct",
                "directness_score": 0.9,
                "formality_level": "formal",
                "characteristics": ["precise communication", "fact-based", "structured approach"],
                "negotiation_patterns": ["thorough preparation", "detailed discussions", "systematic approach"]
            },
            "chinese": {
                "communication_style": "indirect",
                "directness_score": 0.3,
                "formality_level": "formal",
                "characteristics": ["face-saving", "hierarchical respect", "relationship building"],
                "negotiation_patterns": ["patience", "reciprocity", "long-term relationships"]
            },
            "british": {
                "communication_style": "polite-indirect",
                "directness_score": 0.4,
                "formality_level": "formal",
                "characteristics": ["understatement", "politeness", "diplomatic language"],
                "negotiation_patterns": ["diplomatic approach", "compromise seeking", "procedural focus"]
            },
            "french": {
                "communication_style": "eloquent",
                "directness_score": 0.6,
                "formality_level": "formal",
                "characteristics": ["intellectual discourse", "logical arguments", "cultural pride"],
                "negotiation_patterns": ["philosophical approach", "principled positions", "formal protocols"]
            }
        }

    def analyze_cultural_context(self, cultures: List[str], text_content: str = None) -> Dict[str, Any]:
        """Analyze cultural context and potential friction points"""
        if not cultures:
            return {
                "analysis": "No cultural backgrounds specified",
                "potential_mismatches": [],
                "recommendations": []
            }

        normalized_cultures = [culture.lower().strip() for culture in cultures]
        cultural_profiles = []
        
        for culture in normalized_cultures:
            if culture in self.cultural_rules:
                cultural_profiles.append({
                    "culture": culture,
                    **self.cultural_rules[culture]
                })

        if len(cultural_profiles) < 2:
            return {
                "cultural_profiles": cultural_profiles,
                "potential_mismatches": [],
                "recommendations": ["Single culture detected - monitor for internal consistency"]
            }

        # Identify potential mismatches
        mismatches = self._identify_mismatches(cultural_profiles)
        recommendations = self._generate_recommendations(cultural_profiles, mismatches)

        return {
            "cultural_profiles": cultural_profiles,
            "potential_mismatches": mismatches,
            "recommendations": recommendations,
            "directness_gap": self._calculate_directness_gap(cultural_profiles),
            "formality_alignment": self._check_formality_alignment(cultural_profiles)
        }

    def _identify_mismatches(self, profiles: List[Dict]) -> List[Dict[str, str]]:
        """Identify potential cultural mismatches"""
        mismatches = []
        
        for i, profile1 in enumerate(profiles):
            for profile2 in profiles[i+1:]:
                # Directness mismatch
                directness_diff = abs(profile1["directness_score"] - profile2["directness_score"])
                if directness_diff > 0.4:
                    mismatches.append({
                        "type": "communication_style",
                        "cultures": f"{profile1['culture']} vs {profile2['culture']}",
                        "issue": f"Significant directness gap: {profile1['communication_style']} vs {profile2['communication_style']}",
                        "severity": "high" if directness_diff > 0.6 else "medium"
                    })

                # Formality mismatch
                if profile1["formality_level"] != profile2["formality_level"]:
                    mismatches.append({
                        "type": "formality",
                        "cultures": f"{profile1['culture']} vs {profile2['culture']}",
                        "issue": f"Formality mismatch: {profile1['formality_level']} vs {profile2['formality_level']}",
                        "severity": "medium"
                    })

        return mismatches

    def _generate_recommendations(self, profiles: List[Dict], mismatches: List[Dict]) -> List[str]:
        """Generate cultural adaptation recommendations"""
        recommendations = []
        
        if not mismatches:
            recommendations.append("Cultural alignment appears good - maintain current communication approach")
            return recommendations

        for mismatch in mismatches:
            if mismatch["type"] == "communication_style":
                if "direct" in mismatch["issue"] and "indirect" in mismatch["issue"]:
                    recommendations.append("Bridge communication styles: Use clear statements followed by diplomatic softening")
                    recommendations.append("Allow extra time for indirect communicators to process and respond")
                    
            elif mismatch["type"] == "formality":
                recommendations.append("Adapt formality level: Err on the side of more formal communication")
                recommendations.append("Use titles and respectful address until informality is explicitly established")

        # Add general recommendations based on specific cultures present
        cultures = [p["culture"] for p in profiles]
        
        if "japanese" in cultures or "chinese" in cultures:
            recommendations.append("Allow for face-saving opportunities and avoid direct confrontation")
            
        if "german" in cultures:
            recommendations.append("Provide detailed documentation and structured agenda")
            
        if "american" in cultures and any(c in ["japanese", "chinese"] for c in cultures):
            recommendations.append("Americans: Slow down decision-making pace; Asians: Be more explicit about concerns")

        return recommendations

    def _calculate_directness_gap(self, profiles: List[Dict]) -> float:
        """Calculate the gap in directness scores"""
        if len(profiles) < 2:
            return 0.0
        
        scores = [p["directness_score"] for p in profiles]
        return max(scores) - min(scores)

    def _check_formality_alignment(self, profiles: List[Dict]) -> Dict[str, Any]:
        """Check alignment in formality levels"""
        formality_levels = [p["formality_level"] for p in profiles]
        unique_levels = set(formality_levels)
        
        return {
            "aligned": len(unique_levels) == 1,
            "levels_present": list(unique_levels),
            "recommendation": "formal" if "formal" in unique_levels else "informal"
        }

    def flag_cultural_issues_in_text(self, text: str, cultures: List[str]) -> List[Dict[str, str]]:
        """Flag potential cultural issues in text content"""
        flags = []
        text_lower = text.lower()
        
        # Direct criticism flags
        direct_criticism_words = ["wrong", "mistake", "error", "bad idea", "disagree", "no"]
        if any(word in text_lower for word in direct_criticism_words):
            asian_cultures = ["japanese", "chinese", "korean"]
            if any(culture.lower() in asian_cultures for culture in cultures):
                flags.append({
                    "type": "direct_criticism",
                    "issue": "Direct criticism detected - may cause face-loss for Asian participants",
                    "suggestion": "Consider softer language like 'perhaps we could explore alternatives'"
                })

        # Time pressure flags
        urgency_words = ["immediately", "asap", "urgent", "deadline", "hurry"]
        if any(word in text_lower for word in urgency_words):
            relationship_cultures = ["japanese", "chinese", "arab"]
            if any(culture.lower() in relationship_cultures for culture in cultures):
                flags.append({
                    "type": "time_pressure",
                    "issue": "Time pressure language may conflict with relationship-building cultures",
                    "suggestion": "Emphasize the importance while allowing for relationship considerations"
                })

        return flags