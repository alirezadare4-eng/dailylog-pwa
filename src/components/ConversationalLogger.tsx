import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  ArrowRight, 
  RotateCcw, 
  Check, 
  Save, 
  AlertCircle,
  Briefcase,
  User,
  Clock,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../db';
import { DailyReport, Activity } from '../types';
import { formatToJalali, formatToJalaliFull, toPersianDigits } from '../utils/jalali';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
}

interface ConversationalLoggerProps {
  targetDate: string; // YYYY-MM-DD
  onFinished: () => void;
  onCancel: () => void;
}

const CONVERSATION_STEPS = [
  {
    step: 0,
    botQuestion: 'سلام! وقت ثبت گزارش روزانهته. امروز چطور گذشت؟ (خلاصه کلی روزت رو بگو)',
    placeholder: 'مثلا: امروز بیشتر روی پروژه‌های شرکت کار کردم و پیشرفت خوبی داشتم...'
  },
  {
    step: 1,
    botQuestion: 'چه کارهای مهم کاری و پروژه‌ای انجام دادی؟ عنوان و پروژه‌ها رو بنویس.',
    placeholder: 'مثلا: روی پروژه سپهریار کار کردم و با مشتری تماس گرفتم...'
  },
  {
    step: 2,
    botQuestion: 'کدام فعالیت‌ها کامل انجام شدند و کدام نیمه‌تمام ماندند؟',
    placeholder: 'مثلا: پروژه سپهریار انجام شد ولی پیگیری مشتری باقی ماند...'
  },
  {
    step: 3,
    botQuestion: 'عالی! امروز در بخش شخصی چه کارهایی انجام دادی؟ (ورزش، مطالعه، خانواده، استراحت)',
    placeholder: 'مثلا: ۳۰ دقیقه پیاده‌روی کردم، با خانواده وقت گذراندم و مطالعه کردم...'
  },
  {
    step: 4,
    botQuestion: 'برای فردا چه برنامه‌ای داری؟ اهداف و اولویت‌های فردات رو بگو.',
    placeholder: 'مثلا: تکمیل فاز اول پروژه، پیگیری قرارداد و ورزش صبحگاهی...'
  }
];

export const ConversationalLogger: React.FC<ConversationalLoggerProps> = ({
  targetDate,
  onFinished,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [existingReport, setExistingReport] = useState<DailyReport | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load existing draft or report for this date
  useEffect(() => {
    async function loadDraft() {
      const rep = await db.reports.where('date').equals(targetDate).first();
      if (rep) {
        setExistingReport(rep);
        // If there was an in-progress draft step
        if (rep.conversationStep !== undefined && rep.isDraft) {
          setCurrentStep(rep.conversationStep);
        }
      }

      // Initialize initial bot greeting
      const initialStep = rep?.conversationStep || 0;
      setMessages([
        {
          id: 'bot-0',
          sender: 'bot',
          text: CONVERSATION_STEPS[initialStep].botQuestion,
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }

    loadDraft();
  }, [targetDate]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save intermediate draft state so user never loses data if tab closes
  const saveDraftLocally = async (newAnswers: Record<number, string>, nextStep: number) => {
    const reportId = existingReport?.id || crypto.randomUUID();
    const jalali = formatToJalali(targetDate);

    const draftReport: DailyReport = {
      id: reportId,
      userId: 'default-user',
      date: targetDate,
      jalaliDate: jalali,
      summary: newAnswers[0] || existingReport?.summary || '',
      tomorrowPlan: newAnswers[4] || existingReport?.tomorrowPlan || '',
      isDraft: true,
      conversationStep: nextStep,
      createdAt: existingReport?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'updated'
    };

    await db.reports.put(draftReport);
    setExistingReport(draftReport);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    const updatedAnswers = { ...answers, [currentStep]: userText };
    setAnswers(updatedAnswers);

    // Append User Message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setInputText('');

    if (currentStep < CONVERSATION_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);

      // Append next Bot question
      const botMsg: ChatMessage = {
        id: `bot-${nextStep}`,
        sender: 'bot',
        text: CONVERSATION_STEPS[nextStep].botQuestion,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...newMessages, botMsg]);

      // Save draft in background
      await saveDraftLocally(updatedAnswers, nextStep);
    } else {
      // Reached final step
      setCurrentStep(CONVERSATION_STEPS.length);
      const botEndMsg: ChatMessage = {
        id: 'bot-end',
        sender: 'bot',
        text: 'بسیار عالی! تمام اطلاعات دریافت شد. در حال تبدیل به گزارش دسته‌بندی‌شده و ساخت فعالیت‌ها هستم...',
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...newMessages, botEndMsg]);
      await processAndFinalizeReport(updatedAnswers, false);
    }
  };

  // Convert conversational answers into structured Activities and DailyReport
  const processAndFinalizeReport = async (finalAnswers: Record<number, string>, asDraft: boolean) => {
    setIsSubmitting(true);
    try {
      const reportId = existingReport?.id || crypto.randomUUID();
      const jalali = formatToJalali(targetDate);
      const nowIso = new Date().toISOString();

      const summary = finalAnswers[0] || '';
      const workDoneText = finalAnswers[1] || '';
      const statusText = finalAnswers[2] || '';
      const personalText = finalAnswers[3] || '';
      const tomorrowPlan = finalAnswers[4] || '';

      // Create Report Entity
      const finalReport: DailyReport = {
        id: reportId,
        userId: 'default-user',
        date: targetDate,
        jalaliDate: jalali,
        summary,
        tomorrowPlan,
        isDraft: asDraft,
        conversationStep: currentStep,
        createdAt: existingReport?.createdAt || nowIso,
        updatedAt: nowIso,
        syncStatus: 'updated'
      };

      await db.reports.put(finalReport);

      // Parse structured activities from natural language
      // 1. Parse Work activities
      if (workDoneText) {
        const lines = workDoneText.split(/[\n،,و\.]+/).map(s => s.trim()).filter(s => s.length > 2);
        for (const item of lines) {
          const isPending = statusText.includes(item) && (statusText.includes('ماند') || statusText.includes('نیمه') || statusText.includes('باقی'));
          
          let projectMatch = 'سپهریار';
          if (item.includes('مشتری') || item.includes('فروش')) projectMatch = 'پشتیبانی مشتریان';
          else if (item.includes('توسعه') || item.includes('محصول')) projectMatch = 'توسعه محصول';

          const act: Activity = {
            id: crypto.randomUUID(),
            reportId: reportId,
            type: 'work',
            title: item,
            description: `ثبت شده از طریق گفت‌وگو برای روز ${jalali}`,
            status: isPending ? 'in_progress' : 'completed',
            project: projectMatch,
            durationMinutes: 60,
            priority: 'medium',
            createdAt: nowIso,
            updatedAt: nowIso,
            syncStatus: 'created'
          };
          await db.activities.put(act);
        }
      }

      // 2. Parse Personal activities
      if (personalText) {
        const lines = personalText.split(/[\n،,و\.]+/).map(s => s.trim()).filter(s => s.length > 2);
        for (const item of lines) {
          let cat = 'روزمره';
          if (item.includes('خانواده')) cat = 'خانواده';
          else if (item.includes('ورزش') || item.includes('پیاده')) cat = 'ورزش و سلامتی';
          else if (item.includes('مطالعه') || item.includes('فیلم') || item.includes('کتاب')) cat = 'تفریح و مطالعه';
          else if (item.includes('خرید') || item.includes('پول') || item.includes('بانک')) cat = 'امور مالی';

          const act: Activity = {
            id: crypto.randomUUID(),
            reportId: reportId,
            type: 'personal',
            title: item,
            description: `فعالیت شخصی ثبت شده در گفت‌وگو`,
            status: 'completed',
            category: cat,
            createdAt: nowIso,
            updatedAt: nowIso,
            syncStatus: 'created'
          };
          await db.activities.put(act);
        }
      }

      if (!asDraft) {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 }
        });
      }

      setTimeout(() => {
        onFinished();
      }, 1200);

    } catch (err) {
      console.error('Error saving conversational report:', err);
      alert('خطا در ذخیره‌سازی گزارش');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStepBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setInputText(answers[prevStep] || '');
      // Retain messages up to previous bot question
      const botIndex = messages.findIndex(m => m.id === `bot-${prevStep}`);
      if (botIndex !== -1) {
        setMessages(messages.slice(0, botIndex + 1));
      }
    }
  };

  const handleSaveAsIncompleteDraft = async () => {
    await processAndFinalizeReport(answers, true);
  };

  return (
    <div className="soft-card flex flex-col h-[650px] max-h-[85vh] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span>ثبت گزارش هوشمند مکالمه‌ای</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-normal">
                {formatToJalali(targetDate)}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              مرحله {toPersianDigits(Math.min(currentStep + 1, CONVERSATION_STEPS.length))} از {toPersianDigits(CONVERSATION_STEPS.length)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentStep > 0 && currentStep < CONVERSATION_STEPS.length && (
            <button
              onClick={handleStepBack}
              className="px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1 transition-colors"
              title="بازگشت و ویرایش پاسخ قبلی"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>مرحله قبل</span>
            </button>
          )}

          <button
            onClick={handleSaveAsIncompleteDraft}
            className="px-2.5 py-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg flex items-center gap-1 transition-colors"
            title="ذخیره موقت و ادامه در آینده"
          >
            <Save className="w-3.5 h-3.5" />
            <span>ذخیره موقت</span>
          </button>

          <button
            onClick={onCancel}
            className="text-xs px-2.5 py-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            انصراف
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-700 h-1">
        <div 
          className="bg-blue-600 h-1 transition-all duration-300"
          style={{ width: `${((currentStep) / CONVERSATION_STEPS.length) * 100}%` }}
        />
      </div>

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isBot = msg.sender === 'bot';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}
            >
              {isBot && (
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 text-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isBot
                    ? 'bg-slate-100 dark:bg-slate-700/70 text-slate-800 dark:text-slate-100 rounded-tr-none'
                    : 'bg-blue-600 text-white rounded-tl-none shadow-sm shadow-blue-600/20'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <span className={`block text-[10px] mt-1 text-left ${isBot ? 'text-slate-400 dark:text-slate-500' : 'text-blue-200'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={chatBottomRef} />
      </div>

      {/* Input / Control Footer */}
      {currentStep < CONVERSATION_STEPS.length ? (
        <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-800 flex items-end gap-2">
          <textarea
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={CONVERSATION_STEPS[currentStep]?.placeholder || 'پاسخ خود را بنویسید...'}
            className="flex-1 resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="h-10 px-4 rounded-xl bg-blue-600 text-white font-medium text-sm flex items-center justify-center gap-1.5 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors shrink-0"
          >
            <span>ارسال</span>
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </form>
      ) : (
        <div className="p-4 border-t border-slate-100 dark:border-slate-700/60 bg-emerald-50 dark:bg-emerald-950/30 text-center">
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2">
            <Check className="w-5 h-5 text-emerald-600" />
            <span>گزارش با موفقیت آماده و ثبت شد!</span>
          </p>
        </div>
      )}
    </div>
  );
};

