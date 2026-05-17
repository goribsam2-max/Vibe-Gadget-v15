const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  let files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const pages = walkSync('./pages');
const components = walkSync('./components');
const files = [...pages, ...components];

let replacedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // We want to replace rounded-full with rounded-2xl for elements with large paddings like p-4, p-5, p-6, p-8, p-10, p-12, py-12, py-8 etc
  // We can just use a regex. If we see `p-` followed by a number >= 4, and it has `rounded-full`, we'll replace rounded-full with rounded-2xl
  
  // A heuristic: simply replace `rounded-full` to `rounded-2xl` for now where it is a section
  // In tailwind, classes order is arbitrary.
  // Instead of full regex parsing, let's look for common patterns manually that appear in the codebase
  // "bg-white dark:bg-zinc-900 p-[4-9] rounded-full" -> "bg-white dark:bg-zinc-900 p-[4-9] rounded-2xl"
  // "bg-zinc-50 dark:bg-zinc-800 p-[4-9] rounded-full" -> "bg-zinc-50 dark:bg-zinc-800 p-[4-9] rounded-2xl"

  content = content.replace(/rounded-full(.*?)p-(4|5|6|8|10|12)/g, "rounded-2xl$1p-$2");
  content = content.replace(/p-(4|5|6|8|10|12)(.*?)rounded-full/g, "p-$1$2rounded-2xl");
  
  // Also match p-2 and p-3 but avoid w-8, h-8 etc (circle buttons)
  content = content.replace(/(?<!w-\d+\s+h-\d+\s+[^"]*)rounded-full(.*?)p-(2|3)(?!\w)/g, "rounded-2xl$1p-$2");
  content = content.replace(/(?<!w-\d+\s+h-\d+\s+[^"]*)p-(2|3)(.*?)rounded-full(?!\w)/g, "p-$1$2rounded-2xl");

  content = content.replace(/rounded-full mb-4 overflow-hidden/g, "rounded-xl mb-4 overflow-hidden"); // The product card image container

  content = content.replace(/className="w-full bg-zinc-50 dark:bg-\[#000000\] px-4 py-3.5 rounded-full /g, 'className="w-full bg-zinc-50 dark:bg-[#000000] px-4 py-3.5 rounded-xl ');
  content = content.replace(/className="w-full bg-zinc-50 dark:bg-\[#000000\] pl-4 pr-12 py-3.5 rounded-full /g, 'className="w-full bg-zinc-50 dark:bg-[#000000] pl-4 pr-12 py-3.5 rounded-xl ');

  content = content.replace(/rounded-full(.*?)py-(8|10|12|16|20|24|32)/g, "rounded-2xl$1py-$2");
  content = content.replace(/py-(8|10|12|16|20|24|32)(.*?)rounded-full/g, "py-$1$2rounded-2xl");

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
    replacedCount++;
  }
});

console.log(`Replaced in ${replacedCount} files.`);
