
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calculator, ArrowRightLeft } from 'lucide-react';

const unitConversions: Record<string, Record<string, number>> = {
  // Base unit is grams
  grams: { cups: 128, tbsp: 8, tsp: 2.67, ml: 1 },
  // Base unit is cups
  cups: { grams: 128, tbsp: 16, tsp: 48, ml: 240 },
  // Base unit is tbsp
  tbsp: { grams: 8, cups: 0.0625, tsp: 3, ml: 15 },
  // Base unit is tsp
  tsp: { grams: 2.67, cups: 0.0208, tbsp: 0.333, ml: 5 },
  // Base unit is ml
  ml: { grams: 1, cups: 0.00416, tbsp: 0.0666, tsp: 0.2 },
};

const unitLabels: Record<string, string> = {
  grams: 'גרם',
  cups: 'כוסות',
  tbsp: 'כפות',
  tsp: 'כפיות',
  ml: 'מ"ל',
};

export default function ConverterPage() {
  const [amount, setAmount] = useState<number | string>(1);
  const [fromUnit, setFromUnit] = useState('grams');
  const [toUnit, setToUnit] = useState('cups');
  const [result, setResult] = useState<string>('');

  const handleConvert = () => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setResult('אנא הזן כמות חיובית.');
      return;
    }
    
    if (fromUnit === toUnit) {
      setResult(numericAmount.toString());
      return;
    }

    const fromRate = unitConversions[fromUnit]?.[toUnit];
    if (fromRate !== undefined) {
      const convertedAmount = numericAmount * fromRate;
      setResult(convertedAmount.toFixed(2));
    } else {
        // Fallback for indirect conversion (e.g., tbsp to ml)
        const toGrams = numericAmount * unitConversions[fromUnit]['grams'];
        const fromGrams = toGrams / unitConversions[toUnit]['grams'];
        setResult(fromGrams.toFixed(2));
    }
  };
  
  const swapUnits = () => {
      const currentFrom = fromUnit;
      setFromUnit(toUnit);
      setToUnit(currentFrom);
  }

  return (
    <div className="max-w-md mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-primary flex items-center gap-3">
            <Calculator size={30} />
            ממיר מידות
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            השתמש בממיר זה להמרת יחידות מידה נפוצות בבישול. שים לב, ההמרות הן קירוב בלבד ועשויות להשתנות בין חומרים שונים (לדוגמה, כוס קמח אינה שוקלת כמו כוס סוכר).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-end gap-4">
             {/* From Unit */}
            <div className="space-y-2">
              <Label htmlFor="fromUnit">ממידה</Label>
              <Select value={fromUnit} onValueChange={setFromUnit}>
                <SelectTrigger id="fromUnit">
                  <SelectValue placeholder="בחר יחידה" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(unitLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="ghost" size="icon" onClick={swapUnits} aria-label="החלף יחידות">
                <ArrowRightLeft className="text-primary"/>
            </Button>

            {/* To Unit */}
            <div className="space-y-2">
              <Label htmlFor="toUnit">למידה</Label>
              <Select value={toUnit} onValueChange={setToUnit}>
                <SelectTrigger id="toUnit">
                  <SelectValue placeholder="בחר יחידה" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(unitLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">כמות להמרה</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="לדוגמה, 100"
              min="0"
            />
          </div>

          <Button onClick={handleConvert} className="w-full">
            המר
          </Button>

          {result && (
            <div className="text-center pt-4">
              <p className="text-muted-foreground">תוצאה:</p>
              <p className="text-2xl font-bold text-primary">
                {amount} {unitLabels[fromUnit]} = {result} {unitLabels[toUnit]}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
