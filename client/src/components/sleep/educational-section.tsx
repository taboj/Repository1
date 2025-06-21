import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

export default function EducationalSection() {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-700 border-0">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Lightbulb className="text-yellow-500 mr-2 h-5 w-5" />
          Sleep Science & Tips
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">Why Sleep Cycles Matter</h4>
              <p className="text-sm text-muted-foreground">
                Sleep occurs in 90-minute cycles. Waking up at the end of a cycle helps you feel more refreshed and alert.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">Better Sleep Hygiene</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Keep a consistent sleep schedule</li>
                <li>• Avoid screens 1 hour before bed</li>
                <li>• Keep your bedroom cool and dark</li>
              </ul>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            <strong>Scientific backing:</strong> Research shows that timing your sleep around natural 90-minute cycles 
            can significantly improve sleep quality and daytime alertness.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
