#!/bin/sh

VER=`grep -Go 'version\>\(.*\)\<' src/install.rdf | grep -Go '>\(.*\)<' | sed -e 's/[><]*//g'`
XPI="restartless-restart-$VER.xpi"
echo "Building $XPI ..."

# Copy base structure to a temporary build directory and move in to it
cd src
rm -rf build
mkdir build
cp -r \
  bootstrap.js images includes locale install.rdf icon.png icon64.png \
  build/
cd build

# Cleaning up unwanted files
find . -depth -name '*~' -exec rm -rf "{}" \;
find . -depth -name '#*' -exec rm -rf "{}" \;
find . -depth -name '.DS_Store' -exec rm "{}" \;
find . -depth -name 'Thumbs.db' -exec rm "{}" \;

zip -qr9XD "../../$XPI" *

cd ..
rm -rf build
cd ..
