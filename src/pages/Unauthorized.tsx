import { Card, CardContent } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Ban } from 'lucide-react';

const Unauthorized = () => (
  <div className="flex min-h-screen items-center justify-center p-4">
    <Card className="w-full max-w-md text-center">
      <CardContent className="pt-6 space-y-4">
        <Ban className="mx-auto h-16 w-16 text-primary" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
        <a href="/" className={buttonVariants({ variant: 'outline' })}>Go Home</a>
      </CardContent>
    </Card>
  </div>
);

export default Unauthorized;
