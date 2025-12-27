export type UILanguage = 'en' | 'hi';

export const translations = {
    en: {
        heroTitle_1: "Create",
        heroTitle_italic: "viral",
        heroTitle_2: "reels in just 1 minute",
        heroSubtitle: "Post reels on Insta and Youtube to become influencer and earn money",
        createFirstVideo: "Create your first video",
        trustedBy: "Trusted by over 12K happy creators",
        // features
        feature1Title: "AI Scripting",
        feature1Desc: "Generate engaging scripts in seconds with our advanced AI.",
        feature2Title: "Voiceovers",
        feature2Desc: "Choose from hundreds of realistic AI voices in any language.",
        feature3Title: "Auto-Visuals",
        feature3Desc: "AI automatically finds or generates the perfect visuals for your story.",
        // CreateVideoPage
        createHeader: "Create viral insta reels",
        createSubheader: "Turn your idea into a ready to post reel in under 60 seconds",
        languageLabel: "Language",
        videoIdeaLabel: "Video Idea",
        generateButton: "Generate Video",
        generating: "Generating",
        creditsLeft: "No credits left.",
        buyMore: "Buy more",
        clearText: "Clear text",
        generationStarting: "Your reel video will start generating now...",
        pleaseWait: "Please wait, this may take a moment.",
        exportErrorServerless: "Production downloading is currently limited. Please use the local development server for full video exports.",
        readymadeStories: "Readymade Stories",
        aiScriptWriter: "AI Script Writer",
        screenshotToStoryInside: "Screenshot se story le",
        topicPopupTitle: "AI Script Writer",
        topicPlaceholder: "Enter topic of the story...",
        newsReelInside: "News Reel",
        photoToReel: "Photo to Reel",
        speakAndWrite: "Speak | AI Write | Clear"
    },
    hi: {
        heroTitle_1: "अब",
        heroTitle_italic: "1 मिनट",
        heroTitle_2: "में वायरल रील्स बनाएं",
        heroSubtitle: "इंस्टा और यूट्यूब पर रील्स डालें, इन्फ्लुएंसर बनें और पैसे कमाएं",
        createFirstVideo: "अपना पहला वीडियो बनाएं",
        trustedBy: "12,000+ खुश क्रिएटर्स का भरोसा",
        // features
        feature1Title: "AI स्क्रिप्टिंग",
        feature1Desc: "हमारे एडवांस AI के साथ सेकंडों में आकर्षक स्क्रिप्ट बनाएं।",
        feature2Title: "वॉइसओवर",
        feature2Desc: "किसी भी भाषा में सैकड़ों रियलिस्टिक AI आवाजों में से चुनें।",
        feature3Title: "ऑटो-विजुअल्स",
        feature3Desc: "AI आपकी कहानी के लिए परफेक्ट विजुअल्स ऑटोमेटिकली ढूंढता या बनाता है।",
        // CreateVideoPage
        createHeader: "वायरल इंस्टा रील बनाएं",
        createSubheader: "60 सेकंड से कम समय में अपने विचार को पोस्ट के लिए तैयार रील में बदलें",
        languageLabel: "भाषा",
        videoIdeaLabel: "Video के लिए स्टोरी लिखिए",
        generateButton: "वीडियो बनाएं",
        generating: "बन रहा है",
        creditsLeft: "क्रेडिट खत्म हो गए हैं।",
        buyMore: "और खरीदें",
        clearText: "लिखा हुआ मिटाएं",
        generationStarting: "आपकी रील वीडियो अब बनना शुरू हो जाएगी...",
        pleaseWait: "कृपया प्रतीक्षा करें, इसमें थोड़ा समय लग सकता है",
        exportErrorServerless: "प्रोडक्शन डाउनलोडिंग अभी सीमित है। पूर्ण वीडियो एक्सपोर्ट के लिए कृपया लोकल सर्वर का उपयोग करें।",
        readymadeStories: "तैयार कहानियाँ",
        aiScriptWriter: "AI स्क्रिप्ट राइटर",
        screenshotToStoryInside: "Screenshot से स्टोरी लें",
        topicPopupTitle: "AI स्क्रिप्ट राइटर",
        topicPlaceholder: "कहानी का विषय लिखें...",
        newsReelInside: "News से रील",
        photoToReel: "Photo से रील",
        speakAndWrite: "Speak | AI Write | Clear"
    }
};

export type TranslationKey = keyof typeof translations.en;
