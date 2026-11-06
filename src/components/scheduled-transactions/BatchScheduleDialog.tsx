import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateToYYYYMMDD } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface BatchScheduleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onConfirm: (settings: {
    frequency_value: number;
    frequency_unit: string;
    date: string;
  }) => void;
}

export function BatchScheduleDialog({
  isOpen,
  onOpenChange,
  count,
  onConfirm,
}: BatchScheduleDialogProps) {
  const { t } = useTranslation();
  const [frequencyValue, setFrequencyValue] = React.useState(1);
  const [frequencyUnit, setFrequencyUnit] = React.useState("m");
  const [date, setDate] = React.useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDateToYYYYMMDD(tomorrow);
  });

  const handleConfirm = () => {
    onConfirm({
      frequency_value: frequencyValue,
      frequency_unit: frequencyUnit,
      date,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("scheduled.batch.title", {
              count,
              defaultValue: "Schedule {{count}} Transactions",
            })}
          </DialogTitle>
          <DialogDescription>
            {t("scheduled.batch.description", {
              defaultValue:
                "These transactions will be converted into recurrent scheduled transactions.",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              {t("scheduled.batch.startDate", { defaultValue: "Start Date" })}
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">
              {t("scheduled.batch.frequency", { defaultValue: "Frequency" })}
            </Label>
            <div className="col-span-3 flex gap-2">
              <Input
                type="number"
                min="1"
                value={frequencyValue}
                onChange={(e) => setFrequencyValue(parseInt(e.target.value))}
                className="w-20"
              />
              <Select value={frequencyUnit} onValueChange={setFrequencyUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="d">
                    {t("scheduled.dialog.days", { defaultValue: "Days" })}
                  </SelectItem>
                  <SelectItem value="w">
                    {t("scheduled.dialog.weeks", { defaultValue: "Weeks" })}
                  </SelectItem>
                  <SelectItem value="m">
                    {t("scheduled.dialog.months", { defaultValue: "Months" })}
                  </SelectItem>
                  <SelectItem value="y">
                    {t("scheduled.dialog.years", { defaultValue: "Years" })}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("scheduled.dialog.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button onClick={handleConfirm}>
            {t("scheduled.batch.scheduleAll", { defaultValue: "Schedule All" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
