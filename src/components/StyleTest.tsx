import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function StyleTest() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-4xl font-bold text-blue-600">TailwindCSS Test</h1>
      
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
          <CardDescription>This should be styled with TailwindCSS</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full">Test Button</Button>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-100 p-4 rounded">Red</div>
        <div className="bg-green-100 p-4 rounded">Green</div>
        <div className="bg-blue-100 p-4 rounded">Blue</div>
      </div>
    </div>
  );
}
