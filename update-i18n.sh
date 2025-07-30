#!/bin/bash

# Script to update all components from useLanguage to useTranslation

# Find all files that import useLanguage from LanguageContext
files=$(grep -l "import.*useLanguage.*from.*LanguageContext" --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" -r src/)

# Loop through each file and update the import and usage
for file in $files; do
  echo "Updating $file"
  # Replace the import statement
  sed -i '' "s/import { useLanguage } from '\.\.\/context\/LanguageContext';/import { useTranslation } from 'react-i18next';/g" "$file"
  # Replace the hook usage
  sed -i '' "s/const { t } = useLanguage();/const { t } = useTranslation();/g" "$file"
  # Replace any other useLanguage() calls
  sed -i '' "s/useLanguage()/useTranslation()/g" "$file"
done

echo "All files have been updated to use react-i18next"