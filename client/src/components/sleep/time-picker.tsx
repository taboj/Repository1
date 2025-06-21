import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TimePickerProps {
  selectedTime: {
    hour: number;
    minute: number;
    period: 'AM' | 'PM';
  };
  onTimeChange: (time: { hour: number; minute: number; period: 'AM' | 'PM' }) => void;
  label: string;
}

export default function TimePicker({ selectedTime, onTimeChange, label }: TimePickerProps) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = [0, 15, 30, 45];

  const handleHourChange = (hour: string) => {
    onTimeChange({ ...selectedTime, hour: parseInt(hour) });
  };

  const handleMinuteChange = (minute: string) => {
    onTimeChange({ ...selectedTime, minute: parseInt(minute) });
  };

  const handlePeriodChange = (period: string) => {
    onTimeChange({ ...selectedTime, period: period as 'AM' | 'PM' });
  };

  return (
    <div className="mb-6">
      <Label className="block text-lg font-medium mb-4">{label}</Label>
      <div className="flex justify-center items-center space-x-4 bg-muted rounded-xl p-6">
        {/* Hour Picker */}
        <div className="text-center">
          <Label className="block text-sm font-medium mb-2">Hour</Label>
          <Select value={selectedTime.hour.toString()} onValueChange={handleHourChange}>
            <SelectTrigger className="w-20 text-2xl font-bold text-center border-2 focus:border-primary dark:focus:border-mint-400">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {hours.map(hour => (
                <SelectItem key={hour} value={hour.toString()}>
                  {hour.toString().padStart(2, '0')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-3xl font-bold text-muted-foreground mt-6">:</div>
        
        {/* Minute Picker */}
        <div className="text-center">
          <Label className="block text-sm font-medium mb-2">Minute</Label>
          <Select value={selectedTime.minute.toString()} onValueChange={handleMinuteChange}>
            <SelectTrigger className="w-20 text-2xl font-bold text-center border-2 focus:border-primary dark:focus:border-mint-400">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {minutes.map(minute => (
                <SelectItem key={minute} value={minute.toString()}>
                  {minute.toString().padStart(2, '0')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* AM/PM Picker */}
        <div className="text-center">
          <Label className="block text-sm font-medium mb-2">Period</Label>
          <Select value={selectedTime.period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-20 text-2xl font-bold text-center border-2 focus:border-primary dark:focus:border-mint-400">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AM">AM</SelectItem>
              <SelectItem value="PM">PM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
