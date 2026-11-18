const fs = require('fs');
const path = require('path');

// --- THE 3 SKELETON TEMPLATES ---

const tableSkeleton = `import { Skeleton } from "@/components/ui/skeleton";
export default function TableLoading() {
  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between"><Skeleton className="h-8 w-48" /><Skeleton className="h-10 w-28" /></div>
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-4 space-y-4">
        <Skeleton className="h-10 w-full mb-4" />
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex justify-between gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/4" /></div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}`;

const dashboardSkeleton = `import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
export default function DashboardLoading() {
  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between"><Skeleton className="h-8 w-48" /><Skeleton className="h-10 w-28" /></div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="shadow-sm border-zinc-200">
            <CardHeader><Skeleton className="h-3 w-16" /></CardHeader>
            <CardContent><Skeleton className="h-8 w-24" /></CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  );
}`;

const formSkeleton = `import { Skeleton } from "@/components/ui/skeleton";
export default function FormLoading() {
  return (
    <div className="w-full max-w-2xl space-y-6">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-32 mt-4" />
    </div>
  );
}`;

// --- DIRECTORY SCANNER ---

// Adjust this if your app router is inside a 'src' folder (e.g., './src/app')
const APP_DIR = path.join(__dirname, 'src', 'app'); 

function scanAndGenerate(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanAndGenerate(fullPath); // Recursively search folders
    } else if (file === 'page.tsx') {
      const pageContent = fs.readFileSync(fullPath, 'utf8');
      const loadingPath = path.join(directory, 'loading.tsx');

      // Skip if a loading file already exists here so we don't overwrite manual work
      if (fs.existsSync(loadingPath)) {
        console.log(`⏭️  Skipped (Already exists): ${loadingPath}`);
        continue;
      }

      // Very simple AI: Analyze the page code to guess the layout
      let selectedTemplate = formSkeleton; // Default to form/generic

      if (pageContent.includes('<table') || pageContent.includes('products.findMany') || pageContent.includes('map((order')) {
        selectedTemplate = tableSkeleton;
      } else if (pageContent.includes('grid-cols-') || pageContent.includes('CardTitle') || pageContent.includes('totalRevenue')) {
        selectedTemplate = dashboardSkeleton;
      }

      fs.writeFileSync(loadingPath, selectedTemplate);
      console.log(`✅ Created loading.tsx for: ${directory.replace(__dirname, '')}`);
    }
  }
}

console.log("🔍 Scanning Next.js app directory for pages...");
scanAndGenerate(APP_DIR);
console.log("✨ All loading states generated successfully!");