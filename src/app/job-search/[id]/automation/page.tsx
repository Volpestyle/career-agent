import { AutomationControl } from '@/components/automation/automation-control';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bot } from 'lucide-react';
import Link from 'next/link';

interface AutomationPageProps {
  params: {
    id: string;
  };
}

export default function AutomationPage({ params }: AutomationPageProps) {
  const sessionId = params.id;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/job-search/${sessionId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Search
          </Button>
        </Link>
        
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Automation Control</h1>
            <p className="text-gray-600">Monitor and control job search automation</p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Browser Automation</CardTitle>
          <CardDescription>
            This page allows you to control the automated job search process. The automation 
            runs in a cloud browser that you can watch and interact with when manual 
            intervention is needed (e.g., solving captchas, handling login prompts).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">What the automation does:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Navigates to job search platforms</li>
                <li>• Applies your search filters</li>
                <li>• Extracts job listings automatically</li>
                <li>• Saves results to your database</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">When you might need to help:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Solving captcha challenges</li>
                <li>• Entering login credentials</li>
                <li>• Handling unexpected pop-ups</li>
                <li>• Site layout changes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Automation Control */}
      <AutomationControl sessionId={sessionId} />
    </div>
  );
}