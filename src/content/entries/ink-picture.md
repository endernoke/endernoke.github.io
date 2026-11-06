---
title: ink-picture
description: The image component we wrote for Instagram CLI. It works out which image protocol a terminal supports and draws accordingly, and now lives on as its own library.
lede: Images in the terminal, for apps built with Ink.
date: 2025-09-07
kind: project
tags: [TypeScript, React, Terminal]
stack: [TypeScript, React]
reach: 2M+ downloads on npm
repo: endernoke/ink-picture
facts: TypeScript · React · 2M+ downloads on npm
links:
  - label: npm
    href: https://www.npmjs.com/package/ink-picture
related: [instagram-cli]
---

Terminals were never meant to show pictures, and each one has its own idea of how to do it. While building [Instagram CLI](/projects/instagram-cli) we needed images that worked everywhere, so we wrote a component for [Ink](https://github.com/vadimdemedes/ink) that works out which protocol a terminal speaks and draws accordingly.

It turned out other people needed the same thing, so it now lives on as its own library on [npm](https://www.npmjs.com/package/ink-picture).
