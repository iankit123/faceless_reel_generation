import { X, Sparkles, Wand2 } from 'lucide-react';

interface Idea {
    title: string;
    english: string;
    hindi: string;
}

const IDEAS: Idea[] = [
    {
        title: "Lord Krishna and Arjun Mahabharat story",
        english: "Create a short cinematic Instagram reel story set during the Mahabharata war. Show Arjun losing confidence on the battlefield, overwhelmed by fear and doubt. Lord Krishna calmly guides him through words and actions, reminding him of his duty and inner strength. Show the emotional shift from confusion to clarity. End the story with a clear moral about doing one’s duty without attachment to results. Tone should be epic, calm, and emotionally powerful. Avoid modern language.",
        hindi: "महाभारत के युद्ध की पृष्ठभूमि में एक भावनात्मक कहानी बनाओ। अर्जुन युद्धभूमि में भय और संदेह से घिरा हुआ है और धनुष नीचे रख देता है। श्रीकृष्ण शांति से उसे उसके कर्तव्य और आत्मबल की याद दिलाते हैं। कहानी में अर्जुन के मन का परिवर्तन स्पष्ट दिखना चाहिए। अंत में एक स्पष्ट नैतिक संदेश हो कि बिना फल की चिंता किए अपने धर्म का पालन करना ही सच्चा मार्ग है। भाषा गंभीर और पौराणिक हो।"
    },
    {
        title: "Baby Cow and Pig story with friendship moral",
        english: "Create a heartwarming short story for an Instagram reel set on a farm. A baby cow and a baby pig fight and argue every day over small things. Suddenly a fox enters the farm to attack. Show fear, chaos, and then the cow and pig protecting each other and fighting back together. After the fox runs away, they realize the value of unity and become friends. End with a simple moral about friendship and standing together in tough times. Tone should be emotional and family friendly.",
        hindi: "एक खेत की पृष्ठभूमि में एक प्यारी कहानी बनाओ। एक नन्ही गाय और एक नन्हा सूअर रोज छोटी छोटी बातों पर लड़ते रहते हैं। एक दिन एक लोमड़ी खेत में हमला करने आती है। डर और अफरा तफरी के बीच दोनों मिलकर उसका सामना करते हैं। लोमड़ी के भाग जाने के बाद दोनों को दोस्ती और एकता का महत्व समझ आता है। अंत में एक सरल नैतिक संदेश हो कि मुश्किल समय में साथ रहना ही सच्ची ताकत है।"
    },
    {
        title: "Sugar explained and why it is bad for humans",
        english: "Create an informative but engaging Instagram reel story explaining what sugar is and how it affects the human body. Start with sugar being presented as harmless and attractive. Gradually show its negative effects like energy crashes, weight gain, and long term health issues. Use simple language and relatable daily life examples. End with a strong takeaway encouraging mindful consumption without fear mongering. Tone should be clear, honest, and eye opening.",
        hindi: "एक जानकारीपूर्ण लेकिन रोचक रील कहानी बनाओ जिसमें बताया जाए कि शुगर क्या है और यह शरीर पर कैसे असर डालती है। शुरुआत में शुगर को मीठी और बेगुनाह दिखाया जाए। धीरे धीरे इसके दुष्प्रभाव जैसे थकान, वजन बढ़ना और लंबे समय की स्वास्थ्य समस्याएं दिखाओ। रोजमर्रा के उदाहरणों का उपयोग करो। अंत में एक मजबूत संदेश हो कि समझदारी से शुगर का सेवन करना क्यों जरूरी है। भाषा सरल और सच्ची हो।"
    },
    {
        title: "Ram and the Golden Deer illusion",
        english: "Create a cinematic Instagram reel set in the forest during the Ramayana. Show Sita being attracted to the beautiful golden deer and insisting Ram bring it to her. Ram senses danger but gives in to love and duty. Show the illusion breaking when the deer reveals its true form, leading to separation and pain. End with a moral about desire blinding wisdom and the cost of ignoring intuition. Tone should be mythological, emotional, and tragic. Avoid modern language.",
        hindi: "रामायण काल के वन में स्थापित एक भावनात्मक कहानी बनाओ। सीता स्वर्ण मृग को देखकर मोहित हो जाती हैं और राम से उसे लाने का आग्रह करती हैं। राम को अनिष्ट का आभास होता है, फिर भी प्रेम और कर्तव्यवश वे चले जाते हैं। मृग का असली स्वरूप प्रकट होता है और उससे वियोग और पीड़ा जन्म लेती है। अंत में नैतिक संदेश हो कि मोह बुद्धि को ढक देता है और अंतर्ज्ञान की अनदेखी भारी पड़ती है। भाषा पौराणिक और गंभीर हो।"
    },
    {
        title: "The Poor Woodcutter and the River Truth Test",
        english: "Create a short moral Instagram reel about a poor woodcutter who drops his axe into a river. A divine figure appears and tests his honesty by offering better axes. Show his refusal and simple truth. Reward him not just with riches but self respect. End with a moral that honesty builds inner wealth before outer rewards. Tone should be calm, humble, and inspiring.",
        hindi: "एक गरीब लकड़हारे की नैतिक कहानी बनाओ। उसकी कुल्हाड़ी नदी में गिर जाती है। एक दिव्य शक्ति प्रकट होकर उसे सोने और चांदी की कुल्हाड़ियाँ देती है, लेकिन वह सच्चाई स्वीकार करता है। उसकी ईमानदारी के कारण उसे सम्मान और आत्मगौरव मिलता है। अंत में संदेश हो कि ईमानदारी पहले भीतर की संपत्ति बनाती है, फिर बाहर की। भाषा सरल और प्रेरणादायक हो।"
    },
    {
        title: "Crow and Water Pot perseverance story",
        english: "Create a visually engaging Instagram reel of a thirsty crow finding a pot with little water. Show repeated failure, frustration, and determination as the crow drops stones one by one. Emphasize patience over strength. End with a moral about small consistent actions leading to success. Tone should be motivational and child friendly.",
        hindi: "एक प्यासे कौए की कहानी बनाओ जो एक घड़े में थोड़ा सा पानी पाता है। बार बार असफलता और निराशा दिखाई जाए, फिर धैर्य से एक एक कंकड़ डालने की प्रक्रिया। अंत में पानी ऊपर आता है। संदेश हो कि छोटी लेकिन लगातार कोशिशें ही सफलता दिलाती हैं। भाषा सरल और प्रेरक हो।"
    },
    {
        title: "Screen Addiction and the Lost Childhood",
        english: "Create an emotional Instagram reel showing a child slowly getting addicted to mobile screens. Contrast early joy with later isolation, weak health, and emotional distance from parents. Show a turning point where the child rediscovers play, friends, and real connection. End with a moral urging balance, not rejection of technology. Tone should be realistic and eye opening.",
        hindi: "एक भावनात्मक कहानी बनाओ जिसमें एक बच्चा धीरे धीरे मोबाइल स्क्रीन का आदी बन जाता है। शुरुआत में खुशी, फिर अकेलापन, कमजोर स्वास्थ्य और माता पिता से दूरी दिखाओ। एक मोड़ पर बच्चा फिर से खेल और वास्तविक संबंधों की ओर लौटता है। अंत में संदेश हो कि तकनीक का संतुलन जरूरी है, त्याग नहीं। भाषा संवेदनशील और सच्ची हो।"
    },
    {
        title: "Farmer, Son, and the Seasons of Patience",
        english: "Create a grounded Instagram reel story about a farmer teaching his son why crops cannot be rushed. Show the son’s impatience across seasons and the farmer’s calm wisdom. End with harvest time proving the lesson. Moral should focus on timing, patience, and trust in process. Tone should be peaceful and reflective.",
        hindi: "एक किसान और उसके बेटे की कहानी बनाओ जिसमें बेटा फसल को जल्दी उगाने की जिद करता है। अलग अलग मौसमों में उसकी बेचैनी और पिता का धैर्य दिखाओ। कटाई के समय सच्चाई सामने आती है। अंत में संदेश हो कि हर चीज का समय होता है और प्रक्रिया पर भरोसा जरूरी है। भाषा शांत और चिंतनशील हो।"
    }

];

interface SuggestIdeasModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (text: string) => void;
}

export function SuggestIdeasModal({ isOpen, onClose, onSelect }: SuggestIdeasModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] mt-12 sm:mt-0">
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 sticky top-0 z-10 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">Suggest Ideas</h2>
                            <p className="text-xs text-zinc-400">Curated prompts for viral reels</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-500 hover:text-white transition-colors rounded-full hover:bg-zinc-800"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {IDEAS.map((idea, index) => (
                        <div key={index} className="space-y-2">
                            <h3 className="text-sm font-black text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400">
                                    {index + 1}
                                </span>
                                {idea.title}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                {/* English Prompt */}
                                <button
                                    onClick={() => {
                                        onSelect(idea.english);
                                        onClose();
                                    }}
                                    className="group relative text-left bg-zinc-950/50 border border-zinc-800 hover:border-cyan-500/50 p-5 rounded-2xl transition-all hover:bg-zinc-800/50"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black text-cyan-500 uppercase tracking-wider">English Prompt</span>
                                        <Wand2 className="w-4 h-4 text-zinc-600 group-hover:text-cyan-500 transition-colors" />
                                    </div>
                                    <p className="text-sm text-zinc-200 line-clamp-4 leading-relaxed group-hover:text-zinc-200 transition-colors">
                                        {idea.english}
                                    </p>
                                    <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span>USE THIS PROMPT</span>
                                        <Sparkles className="w-3 h-3" />
                                    </div>
                                </button>

                                {/* Hindi Prompt */}
                                <button
                                    onClick={() => {
                                        onSelect(idea.hindi);
                                        onClose();
                                    }}
                                    className="group relative text-left bg-zinc-950/50 border border-zinc-800 hover:border-purple-500/50 p-5 rounded-2xl transition-all hover:bg-zinc-800/50"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-black text-purple-500 uppercase tracking-wider">Hindi Prompt</span>
                                        <Wand2 className="w-4 h-4 text-zinc-600 group-hover:text-purple-500 transition-colors" />
                                    </div>
                                    <p className="text-sm text-zinc-200 line-clamp-4 leading-relaxed group-hover:text-zinc-200 transition-colors font-hindi">
                                        {idea.hindi}
                                    </p>
                                    <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span>USE THIS PROMPT</span>
                                        <Sparkles className="w-3 h-3" />
                                    </div>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Decor */}
                <div className="h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500" />
            </div>
        </div>
    );
}
