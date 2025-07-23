// Medical advice system with safety guardrails
export interface MedicalQuery {
  symptoms: string[];
  severity: 'mild' | 'moderate' | 'severe' | 'emergency';
  duration: string;
  context: string;
}

export interface MedicalResponse {
  advice: string;
  escalation: boolean;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  disclaimer: string;
  followUp?: string[];
}

// Emergency keywords that trigger immediate escalation
const EMERGENCY_KEYWORDS = [
  'chest pain', 'heart attack', 'stroke', 'seizure', 'unconscious',
  'severe bleeding', 'difficulty breathing', 'choking', 'overdose',
  'suicide', 'self harm', 'severe allergic reaction', 'anaphylaxis'
];

// Symptoms requiring medical attention
const URGENT_KEYWORDS = [
  'high fever', 'persistent vomiting', 'severe headache', 'vision problems',
  'severe abdominal pain', 'blood in stool', 'blood in urine', 'severe rash'
];

export class MedicalAdviceSystem {
  private static readonly DISCLAIMER = 
    "This advice is for informational purposes only and should not replace professional medical consultation. Always consult with a healthcare provider for proper diagnosis and treatment.";

  static analyzeQuery(userInput: string): MedicalQuery {
    const input = userInput.toLowerCase();
    const symptoms = this.extractSymptoms(input);
    const severity = this.assessSeverity(input, symptoms);
    const duration = this.extractDuration(input);

    return {
      symptoms,
      severity,
      duration,
      context: userInput
    };
  }

  static generateResponse(query: MedicalQuery): MedicalResponse {
    const { symptoms, severity, context } = query;
    
    // Check for emergency situations
    if (this.isEmergency(context)) {
      return {
        advice: "🚨 This sounds like a medical emergency. Please call 911 or go to the nearest emergency room immediately.",
        escalation: true,
        urgency: 'emergency',
        disclaimer: this.DISCLAIMER,
        followUp: ["Call emergency services immediately", "Do not delay seeking professional help"]
      };
    }

    // Check for urgent situations
    if (this.isUrgent(context) || severity === 'severe') {
      return {
        advice: "⚠️ Your symptoms suggest you should see a healthcare provider soon. Please contact your doctor or visit an urgent care center.",
        escalation: true,
        urgency: 'high',
        disclaimer: this.DISCLAIMER,
        followUp: ["Contact your healthcare provider", "Monitor symptoms closely", "Seek immediate care if symptoms worsen"]
      };
    }

    // Generate general advice for mild to moderate symptoms
    const advice = this.generateGeneralAdvice(symptoms, severity);
    
    return {
      advice,
      escalation: false,
      urgency: severity === 'moderate' ? 'medium' : 'low',
      disclaimer: this.DISCLAIMER,
      followUp: this.generateFollowUp(symptoms)
    };
  }

  private static extractSymptoms(input: string): string[] {
    const commonSymptoms = [
      'headache', 'fever', 'cough', 'sore throat', 'nausea', 'fatigue',
      'dizziness', 'rash', 'pain', 'swelling', 'runny nose', 'congestion'
    ];
    
    return commonSymptoms.filter(symptom => input.includes(symptom));
  }

  private static assessSeverity(input: string, symptoms: string[]): MedicalQuery['severity'] {
    if (this.isEmergency(input)) return 'emergency';
    if (this.isUrgent(input)) return 'severe';
    if (input.includes('severe') || input.includes('intense') || input.includes('unbearable')) {
      return 'severe';
    }
    if (input.includes('moderate') || symptoms.length > 2) return 'moderate';
    return 'mild';
  }

  private static extractDuration(input: string): string {
    const durationPatterns = [
      /(\d+)\s*(day|days|week|weeks|month|months)/gi,
      /(today|yesterday|this morning|last night)/gi
    ];
    
    for (const pattern of durationPatterns) {
      const match = input.match(pattern);
      if (match) return match[0];
    }
    
    return 'recent';
  }

  private static isEmergency(input: string): boolean {
    return EMERGENCY_KEYWORDS.some(keyword => 
      input.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private static isUrgent(input: string): boolean {
    return URGENT_KEYWORDS.some(keyword => 
      input.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private static generateGeneralAdvice(symptoms: string[], severity: MedicalQuery['severity']): string {
    if (symptoms.includes('headache')) {
      return "For headaches, try resting in a quiet, dark room, staying hydrated, and applying a cold or warm compress. Over-the-counter pain relievers may help if appropriate for you.";
    }
    
    if (symptoms.includes('fever')) {
      return "For fever, rest and stay hydrated. You can use over-the-counter fever reducers if appropriate. Monitor your temperature and seek medical care if fever is high (over 103°F/39.4°C) or persistent.";
    }
    
    if (symptoms.includes('cough') || symptoms.includes('sore throat')) {
      return "For respiratory symptoms, try staying hydrated, using throat lozenges, and getting plenty of rest. Honey can help soothe throat irritation. Consider seeing a doctor if symptoms persist or worsen.";
    }
    
    if (symptoms.includes('nausea')) {
      return "For nausea, try sipping clear fluids, eating bland foods like crackers or toast, and resting. Ginger may help with nausea. Avoid strong odors and fatty foods.";
    }
    
    return "For general symptoms, focus on rest, hydration, and monitoring your condition. If symptoms persist, worsen, or you're concerned, please consult with a healthcare provider.";
  }

  private static generateFollowUp(symptoms: string[]): string[] {
    const general = [
      "Monitor your symptoms",
      "Stay hydrated and get plenty of rest",
      "Contact a healthcare provider if symptoms worsen or persist"
    ];
    
    if (symptoms.includes('fever')) {
      general.push("Monitor your temperature regularly");
    }
    
    if (symptoms.includes('pain')) {
      general.push("Note the location, intensity, and duration of pain");
    }
    
    return general;
  }
}
