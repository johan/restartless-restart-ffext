#!/bin/sh

VER=`grep -Go 'version\>\(.*\)\<' src/install.rdf | grep -Go '>\(.*\)<' | sed -e 's/[><]*//g'`
XPI="restartless-restart-$VER.xpi"

# Copy base structure to a temporary build directory and move in to it
echo "Creating build directory ..."
cd src
rm -rf build
mkdir build
cp -r \
  bootstrap.js images includes install.rdf icon.png icon64.png \
  build/
cd build

echo "Cleaning up unwanted files ..."
find . -depth -name '*~' -exec rm -rf "{}" \;
find . -depth -name '#*' -exec rm -rf "{}" \;
find . -depth -name '.DS_Store' -exec rm "{}" \;
find . -depth -name 'Thumbs.db' -exec rm "{}" \;

echo "Creating $XPI ..."
zip -qr9XD "../../$XPI" *

echo "Cleaning up temporary files ..."
cd ..
rm -rf build
cd ..
