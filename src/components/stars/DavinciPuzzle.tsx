import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Lock, Unlock, Trophy } from "lucide-react";
import GeneticHashChip from "@/components/GeneticHashChip";
import { logAction } from "@/lib/geneticHash";

const puzzles = [
  {
    level: 1,
    riddle: "من هزار چهره دارم اما یک روح. نقاشی‌ام اما زنده‌ام. کیستم؟",
    answers: ["مونالیزا", "مونا لیزا"],
    hint: "لبخندم جهانی‌ست",
  },
  {
    level: 2,
    riddle: "بال دارم اما پرنده نیستم. لئوناردو مرا طراحی کرد. چیستم؟",
    answers: ["ماشین پرواز", "اورنیتوپتر"],
    hint: "قبل از هواپیما بود",
  },
  {
    level: 3,
    riddle: "مرد ویترووی‌ام. در دایره و مربعم. نماد چیستم؟",
    answers: ["تناسب", "هارمونی", "انسان کامل"],
    hint: "بدن انسان",
  },
];

const PROGRESS_KEY = "qmetaram-davinci-progress";

export default function DavinciPuzzle() {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [answer, setAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [hash, setHash] = useState("");
  const [wrongAnswer, setWrongAnswer] = useState(false);

  useEffect(() => {
    const saved = parseInt(localStorage.getItem(PROGRESS_KEY) || "0");
    setCurrentLevel(saved);
  }, []);

  const checkAnswer = async () => {
    const puzzle = puzzles[currentLevel];
    if (!puzzle) return;
    const normalized = answer.trim();
    if (puzzle.answers.some((a) => normalized.includes(a))) {
      const next = currentLevel + 1;
      setCurrentLevel(next);
      localStorage.setItem(PROGRESS_KEY, next.toString());
      setAnswer("");
      setShowHint(false);
      setWrongAnswer(false);
      const h = await logAction(`puzzle-solved-level-${puzzle.level}`, "davinci");
      setHash(h);
    } else {
      setWrongAnswer(true);
    }
  };

  const completed = currentLevel >= puzzles.length;
  const puzzle = puzzles[currentLevel];

  return (
    <Card className="bg-card/80 backdrop-blur border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground text-base">
          <Lightbulb className="w-5 h-5 text-star-davinci" />
          معماهای داوینچی
          <span className="text-xs text-muted-foreground">Gate Puzzles</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 mb-3">
          {puzzles.map((p, i) => (
            <Badge key={i} variant={i < currentLevel ? "default" : "outline"} className="gap-1">
              {i < currentLevel ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              سطح {p.level}
            </Badge>
          ))}
        </div>

        {completed ? (
          <div className="text-center py-6 space-y-2">
            <Trophy className="w-12 h-12 text-star-davinci mx-auto" />
            <p className="text-foreground font-bold text-lg">تبریک! همه معماها حل شدند 🎨</p>
            <Badge variant="default">VIP Demo Badge</Badge>
            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={() => { setCurrentLevel(0); localStorage.setItem(PROGRESS_KEY, "0"); }}>
                بازی دوباره
              </Button>
            </div>
          </div>
        ) : puzzle ? (
          <>
            <div className="bg-secondary/50 rounded-lg p-4 text-foreground" dir="rtl">
              <p className="font-bold mb-1">سطح {puzzle.level}</p>
              <p>{puzzle.riddle}</p>
            </div>
            {showHint && (
              <p className="text-sm text-star-davinci">💡 راهنما: {puzzle.hint}</p>
            )}
            <Input
              value={answer}
              onChange={(e) => { setAnswer(e.target.value); setWrongAnswer(false); }}
              onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
              placeholder="پاسخ..."
              className="bg-input text-foreground"
              dir="rtl"
            />
            {wrongAnswer && <p className="text-destructive text-sm">پاسخ نادرست. دوباره امتحان کن!</p>}
            <div className="flex gap-2">
              <Button onClick={checkAnswer} className="flex-1" disabled={!answer.trim()}>بررسی</Button>
              <Button variant="outline" onClick={() => setShowHint(true)} disabled={showHint}>راهنما</Button>
            </div>
          </>
        ) : null}
        <GeneticHashChip hash={hash} />
      </CardContent>
    </Card>
  );
}
