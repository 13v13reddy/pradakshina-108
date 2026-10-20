# Pradakshina

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Static HTML, CSS, and JavaScript modules, selected for GitHub Pages and offline use. The user delegated implementation choices while asking for an aesthetic webpage/PWA.

## Users
The user is going to a temple, will use an iPhone, and wants to complete 108 pradakshinas.

## Product Purpose
Keep track of completed rounds while making it easy to answer “did I already record this round?” A generic plus-button counter does not meet the request.

## Operating Context
Mobile use while walking at a temple. A deliberate action is performed at the same chosen point on each circuit. The application does not detect physical movement or count automatically.

## Capabilities and Constraints
- The target is 108 completed rounds.
- GitHub Pages is the requested host; creating a new repository is authorized.
- Installable on iPhone through Safari’s Add to Home Screen.
- Implementation decisions: hold to record; persistent timestamped receipts; a brief duplicate guard; undo with confirmation; a complete round history; local storage; an offline service worker; optional screen wake lock where available.
- No sign-in or backend. Progress stays in the current browser on the current device.

## Product Principles
- A recorded round should leave visible evidence after the interaction ends.
- Keep the primary action within a comfortable thumb reach.
- Protect progress from accidental duplicate input, page refreshes, and app closure.
- Keep the temple experience quiet, with visual confirmation as the primary feedback.
