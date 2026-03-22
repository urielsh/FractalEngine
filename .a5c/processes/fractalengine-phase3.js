/**
 * @process fractalengine/phase3-integration
 * @description FractalEngine Phase 3: Clean Code Refactoring + Mobile Adaptation + Creative Controls
 * @inputs { targetQuality: number, maxIterations: number }
 * @outputs { success: boolean, milestones: array, totalTests: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { targetQuality = 85, maxIterations = 3 } = inputs;
  const milestoneResults = [];

  // ============================================================================
  // MILESTONE A: CLEAN CODE REFACTORING (6 tasks)
  // ============================================================================

  // A1: Extract shared color mapping module (eliminate duplication)
  const a1Result = await ctx.task(refactorColorModuleTask, {
    description: 'Extract shared color mapping from ColorScheme.ts and fractal.worker.ts into colorMapping.ts',
    files: {
      source1: 'src/colors/ColorScheme.ts',
      source2: 'src/workers/fractal.worker.ts',
      target: 'src/colors/colorMapping.ts'
    }
  });

  // A2: Split fractal implementations into separate files
  const a2Result = await ctx.task(splitFractalsTask, {
    description: 'Split fractals/index.ts (334 lines, 5 classes) into individual files',
    sourceFile: 'src/fractals/index.ts'
  });

  // A3 + A4 + A5 in parallel (independent tasks)
  const [a3Result, a4Result, a5Result] = await ctx.parallel.all([
    // A3: Split UIController
    () => ctx.task(splitUIControllerTask, {
      description: 'Split UIController.ts into ControlsPanel.ts, EventBindings.ts, and slim UIController.ts',
      sourceFile: 'src/ui/UIController.ts'
    }),
    // A4: Extract constants
    () => ctx.task(extractConstantsTask, {
      description: 'Create src/constants.ts with SIDEBAR_WIDTH_PX, TILE_HEIGHT_PX, DEFAULT_CANVAS_WIDTH/HEIGHT, etc.',
      magicNumbers: ['350 (sidebar)', '96 (tile height)', '1024x768 (canvas)', '300 (debounce)', '0.1 (pan step)', '1.1 (zoom factor)']
    }),
    // A5: Remove dead code + add error handling
    () => ctx.task(cleanDeadCodeTask, {
      description: 'Remove unused exportAsImage/setZoom methods, add null guards for canvas context, blob export, getElementById'
    })
  ]);

  // A6: CI/CD pipeline
  const a6Result = await ctx.task(createCIPipelineTask, {
    description: 'Create .github/workflows/ci.yml with Node 20, type-check, test, build steps'
  });

  // Milestone A verification: run tests + type-check
  const milestoneAVerification = await ctx.task(verifyMilestoneTask, {
    milestone: 'A',
    milestoneName: 'Clean Code Refactoring',
    verifyCommand: 'npm run type-check && npm test',
    expectedMinTests: 42,
    tasks: [a1Result, a2Result, a3Result, a4Result, a5Result, a6Result]
  });

  milestoneResults.push({ milestone: 'A', name: 'Clean Code Refactoring', verification: milestoneAVerification });

  // Quality convergence for Milestone A
  let milestoneAQuality = 0;
  let milestoneAIteration = 0;

  while (milestoneAQuality < targetQuality && milestoneAIteration < maxIterations) {
    milestoneAIteration++;

    const qualityResult = await ctx.task(qualityScoringTask, {
      milestone: 'A',
      milestoneName: 'Clean Code Refactoring',
      verification: milestoneAVerification,
      targetQuality,
      iteration: milestoneAIteration,
      criteria: [
        'No color logic duplication between ColorScheme.ts and fractal.worker.ts',
        'Each fractal type in its own file with barrel re-export',
        'UIController split into 3 modules (controller, panel, bindings)',
        'All magic numbers extracted to constants.ts',
        'Dead code removed, error handling added',
        'CI pipeline created and valid',
        'All existing 26 tests still pass',
        'New tests for colorMapping added',
        'tsc --noEmit zero errors'
      ]
    });

    milestoneAQuality = qualityResult.score;

    if (milestoneAQuality < targetQuality && milestoneAIteration < maxIterations) {
      const fixResult = await ctx.task(fixIssuesTask, {
        milestone: 'A',
        feedback: qualityResult.feedback,
        recommendations: qualityResult.recommendations,
        iteration: milestoneAIteration
      });

      // Re-verify after fixes
      const reVerification = await ctx.task(verifyMilestoneTask, {
        milestone: 'A',
        milestoneName: 'Clean Code Refactoring (re-verify)',
        verifyCommand: 'npm run type-check && npm test',
        expectedMinTests: 42,
        tasks: [fixResult]
      });
    }
  }

  // Breakpoint: review Milestone A before proceeding
  await ctx.breakpoint({
    question: `Milestone A (Clean Code) complete. Quality: ${milestoneAQuality}/${targetQuality}. Approve and proceed to Milestone B (Mobile)?`,
    title: 'Milestone A Review — Clean Code Refactoring',
    context: {
      runId: ctx.runId,
      quality: milestoneAQuality
    }
  });

  // ============================================================================
  // MILESTONE B: MOBILE-FIRST RESPONSIVE DESIGN (4 tasks)
  // ============================================================================

  // B1: Responsive layout system
  const b1Result = await ctx.task(responsiveLayoutTask, {
    description: 'Add CSS media queries for desktop (>=1024px), tablet (600-1023px), mobile (<600px). Collapsible sidebar/drawer.',
    files: ['index.html', 'src/main.ts']
  });

  // B2 + B3 in parallel
  const [b2Result, b3Result] = await ctx.parallel.all([
    // B2: Touch gesture support
    () => ctx.task(touchGesturesTask, {
      description: 'Create src/ui/TouchHandler.ts with pinch-to-zoom, single-finger pan, double-tap reset',
      integration: 'Wire into UIController callbacks'
    }),
    // B3: Responsive controls
    () => ctx.task(responsiveControlsTask, {
      description: 'Touch targets >=44px, full-width buttons on mobile (48px min), drag handle on bottom drawer'
    })
  ]);

  // B4: Viewport-aware resolution
  const b4Result = await ctx.task(viewportResolutionTask, {
    description: 'Add devicePixelRatio support (capped at 2x), getOptimalResolution(), reduce maxIterations on mobile',
    file: 'src/renderer/FractalRenderer.ts'
  });

  // Milestone B verification
  const milestoneBVerification = await ctx.task(verifyMilestoneTask, {
    milestone: 'B',
    milestoneName: 'Mobile-First Responsive Design',
    verifyCommand: 'npm run type-check && npm test && npm run build',
    expectedMinTests: 48,
    tasks: [b1Result, b2Result, b3Result, b4Result]
  });

  milestoneResults.push({ milestone: 'B', name: 'Mobile-First Responsive', verification: milestoneBVerification });

  // Quality convergence for Milestone B
  let milestoneBQuality = 0;
  let milestoneBIteration = 0;

  while (milestoneBQuality < targetQuality && milestoneBIteration < maxIterations) {
    milestoneBIteration++;

    const qualityResult = await ctx.task(qualityScoringTask, {
      milestone: 'B',
      milestoneName: 'Mobile-First Responsive Design',
      verification: milestoneBVerification,
      targetQuality,
      iteration: milestoneBIteration,
      criteria: [
        'Desktop layout unchanged (sidebar right, canvas left)',
        'Tablet: collapsible overlay panel with hamburger toggle',
        'Mobile: bottom drawer with FAB toggle, 60vh max',
        'Touch pinch-to-zoom working',
        'Touch single-finger pan working',
        'Double-tap reset working',
        'Canvas fills full viewport on mobile',
        'Touch targets >= 44px (WCAG)',
        'devicePixelRatio handled (capped 2x)',
        'Tests pass, type-check clean, build succeeds'
      ]
    });

    milestoneBQuality = qualityResult.score;

    if (milestoneBQuality < targetQuality && milestoneBIteration < maxIterations) {
      await ctx.task(fixIssuesTask, {
        milestone: 'B',
        feedback: qualityResult.feedback,
        recommendations: qualityResult.recommendations,
        iteration: milestoneBIteration
      });
    }
  }

  await ctx.breakpoint({
    question: `Milestone B (Mobile) complete. Quality: ${milestoneBQuality}/${targetQuality}. Approve and proceed to Milestone C (Creative Controls)?`,
    title: 'Milestone B Review — Mobile Adaptation',
    context: { runId: ctx.runId, quality: milestoneBQuality }
  });

  // ============================================================================
  // MILESTONE C: PHASE 3 CREATIVE CONTROLS (5 tasks)
  // ============================================================================

  // C1: Enhanced color parameters
  const c1Result = await ctx.task(colorParamsTask, {
    description: 'Create ColorParams interface (hueOffset, saturation, brightness, contrast, cycleSpeed), integrate into colorMapping + worker + engine + UI',
    newFiles: ['src/colors/ColorParams.ts'],
    modifyFiles: ['src/colors/colorMapping.ts', 'src/workers/fractal.worker.ts', 'src/engine/FractalEngine.ts', 'src/ui/ControlsPanel.ts']
  });

  // C2 + C3 in parallel (independent feature tracks)
  const [c2Result, c3Result] = await ctx.parallel.all([
    // C2: Custom gradient editor
    () => ctx.task(gradientEditorTask, {
      description: 'Create GradientEditor.ts (interpolation logic) + GradientEditorUI.ts (2-4 color stops, pickers, preview strip)',
      newFiles: ['src/colors/GradientEditor.ts', 'src/ui/GradientEditorUI.ts']
    }),
    // C3: Shape boundaries - basic shapes
    () => ctx.task(shapeBoundariesTask, {
      description: 'Create ShapeBoundary.ts (oval/triangle/rectangle with isInsideShape, distortCoordinates) + DistortionLUT.ts (720-entry polar table)',
      newFiles: ['src/boundaries/ShapeBoundary.ts', 'src/boundaries/DistortionLUT.ts']
    })
  ]);

  // C4: Chess piece silhouettes (depends on C3 shape system)
  const c4Result = await ctx.task(chessPiecesTask, {
    description: 'Create ChessPieces.ts with 6 SDF/polygon chess piece silhouettes (pawn, rook, bishop, knight, queen, king), extend ShapeType',
    newFile: 'src/boundaries/ChessPieces.ts',
    dependsOn: 'src/boundaries/ShapeBoundary.ts'
  });

  // C5: Integration and polish
  const c5Result = await ctx.task(integrationPolishTask, {
    description: 'Wire all new controls into EventBindings, handle L-System + shapes (ctx.clip for mask, disable distortion), collapsible control groups, performance (LUT precompute)',
    scope: 'Full integration of C1-C4 into working application'
  });

  // Milestone C verification
  const milestoneCVerification = await ctx.task(verifyMilestoneTask, {
    milestone: 'C',
    milestoneName: 'Phase 3 Creative Controls',
    verifyCommand: 'npm run type-check && npm test && npm run build',
    expectedMinTests: 92,
    tasks: [c1Result, c2Result, c3Result, c4Result, c5Result]
  });

  milestoneResults.push({ milestone: 'C', name: 'Phase 3 Creative Controls', verification: milestoneCVerification });

  // Quality convergence for Milestone C
  let milestoneCQuality = 0;
  let milestoneCIteration = 0;

  while (milestoneCQuality < targetQuality && milestoneCIteration < maxIterations) {
    milestoneCIteration++;

    const qualityResult = await ctx.task(qualityScoringTask, {
      milestone: 'C',
      milestoneName: 'Phase 3 Creative Controls',
      verification: milestoneCVerification,
      targetQuality,
      iteration: milestoneCIteration,
      criteria: [
        'Color parameter sliders (hue, saturation, brightness, contrast, cycle speed) work in real-time',
        'Custom gradient with 2-4 color stops interpolates correctly',
        'Shape boundaries: oval, triangle, rectangle with aspect ratio and roundness',
        'Chess pieces: all 6 recognizable silhouettes',
        'Mask mode clips fractal to shape boundary',
        'Distortion mode warps fractal to fill shape',
        'L-System: mask via ctx.clip, distortion disabled',
        'Collapsible control groups in UI',
        'All tests pass (92+)',
        'Bundle size < 500KB',
        'Mobile touch + shapes work together'
      ]
    });

    milestoneCQuality = qualityResult.score;

    if (milestoneCQuality < targetQuality && milestoneCIteration < maxIterations) {
      await ctx.task(fixIssuesTask, {
        milestone: 'C',
        feedback: qualityResult.feedback,
        recommendations: qualityResult.recommendations,
        iteration: milestoneCIteration
      });
    }
  }

  // ============================================================================
  // FINAL VERIFICATION
  // ============================================================================

  const finalVerification = await ctx.task(finalReviewTask, {
    milestones: milestoneResults,
    targetQuality,
    qualities: {
      A: milestoneAQuality,
      B: milestoneBQuality,
      C: milestoneCQuality
    }
  });

  await ctx.breakpoint({
    question: `All 3 milestones complete. Quality scores: A=${milestoneAQuality}, B=${milestoneBQuality}, C=${milestoneCQuality}. Final verdict: ${finalVerification.verdict}. Approve for delivery?`,
    title: 'Final Delivery Review — FractalEngine Phase 3',
    context: { runId: ctx.runId }
  });

  return {
    success: finalVerification.approved,
    milestones: milestoneResults,
    qualities: { A: milestoneAQuality, B: milestoneBQuality, C: milestoneCQuality },
    finalVerification,
    metadata: { processId: 'fractalengine/phase3-integration', timestamp: ctx.now() }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// --- Milestone A Tasks ---

export const refactorColorModuleTask = defineTask('refactor-color-module', (args, taskCtx) => ({
  kind: 'agent',
  title: 'A1: Extract shared color mapping module',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior TypeScript engineer specializing in code deduplication and web worker architecture',
      task: 'Extract duplicated color mapping logic into a shared pure-function module that both the main thread and Web Workers can import',
      context: {
        description: args.description,
        files: args.files,
        projectRoot: '/home/urisha/Desktop/workspace/FractalEngine',
        planReference: 'See /home/urisha/.claude/plans/cheerful-snacking-bumblebee.md section A1'
      },
      instructions: [
        '1. Read src/colors/ColorScheme.ts and src/workers/fractal.worker.ts completely',
        '2. Create src/colors/colorMapping.ts with pure functions: hslToRgb, mapClassicHsl, mapFire, mapOcean, mapGrayscale, mapNeon, mapColorByName',
        '3. All functions must be pure (no classes, no DOM, no side effects) — worker-safe',
        '4. Modify ColorScheme.ts: remove local hslToRgb, delegate map() to colorMapping functions',
        '5. Modify fractal.worker.ts: delete duplicated hslToRgb and mapColor (lines 24-74), import mapColorByName from ../colors/colorMapping',
        '6. Create src/__tests__/colorMapping.test.ts with ~8 tests: each scheme mapping, black for converged points, hslToRgb edge cases',
        '7. Run npm test to verify all 26 existing tests still pass plus new tests',
        '8. Run npx tsc --noEmit to verify zero type errors',
        '9. Return summary of files created/modified'
      ],
      outputFormat: 'JSON with filesCreated (array), filesModified (array), summary (string), testsPassed (boolean), typeCheckPassed (boolean)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'summary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        testsPassed: { type: 'boolean' },
        typeCheckPassed: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['milestone-a', 'refactoring', 'color-system']
}));

export const splitFractalsTask = defineTask('split-fractals', (args, taskCtx) => ({
  kind: 'agent',
  title: 'A2: Split fractal implementations into separate files',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior TypeScript engineer',
      task: 'Split the monolithic fractals/index.ts into individual files per fractal class with a barrel re-export',
      context: {
        description: args.description,
        sourceFile: args.sourceFile,
        projectRoot: '/home/urisha/Desktop/workspace/FractalEngine'
      },
      instructions: [
        '1. Read src/fractals/index.ts completely',
        '2. Create src/fractals/Fractal.ts with abstract base class + FractalParameters interface',
        '3. Create src/fractals/MandelbrotSet.ts',
        '4. Create src/fractals/JuliaSet.ts',
        '5. Create src/fractals/BurningShip.ts',
        '6. Create src/fractals/NewtonFractal.ts',
        '7. Create src/fractals/LSystemFractal.ts (includes LSystemPreset, LSYSTEM_PRESETS, turtle graphics)',
        '8. Modify src/fractals/index.ts to become a barrel re-export file',
        '9. Run npm test to verify all 26 existing tests pass unchanged',
        '10. Run npx tsc --noEmit to verify zero type errors'
      ],
      outputFormat: 'JSON with filesCreated, filesModified, summary, testsPassed, typeCheckPassed'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'summary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        testsPassed: { type: 'boolean' },
        typeCheckPassed: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['milestone-a', 'refactoring', 'fractals']
}));

export const splitUIControllerTask = defineTask('split-ui-controller', (args, taskCtx) => ({
  kind: 'agent',
  title: 'A3: Split UIController into 3 modules',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior frontend engineer',
      task: 'Split UIController.ts into ControlsPanel (HTML template), EventBindings (DOM events), and slim UIController (state coordination)',
      context: {
        description: args.description,
        sourceFile: args.sourceFile,
        projectRoot: '/home/urisha/Desktop/workspace/FractalEngine'
      },
      instructions: [
        '1. Read src/ui/UIController.ts completely',
        '2. Create src/ui/ControlsPanel.ts with buildControlsHTML(colorSchemes: string[]): string function',
        '3. Create src/ui/EventBindings.ts with bindControlEvents(controller) and bindKeyboardShortcuts(controller)',
        '4. Slim src/ui/UIController.ts to ~60 lines: state (centerX, centerY, zoom), public methods (handleFractalChange, handleZoomChange, handlePan, handleReset, handleExport)',
        '5. UIController imports and uses ControlsPanel and EventBindings',
        '6. Create src/__tests__/ui.test.ts with ~6 tests for ControlsPanel HTML generation and UIController state transitions',
        '7. Run npm test and npx tsc --noEmit',
        '8. Return summary of changes'
      ],
      outputFormat: 'JSON with filesCreated, filesModified, summary, testsPassed, typeCheckPassed'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'summary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        testsPassed: { type: 'boolean' },
        typeCheckPassed: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['milestone-a', 'refactoring', 'ui']
}));

export const extractConstantsTask = defineTask('extract-constants', (args, taskCtx) => ({
  kind: 'agent',
  title: 'A4: Extract magic numbers to constants.ts',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior TypeScript engineer',
      task: 'Create a constants module and replace all magic numbers across the codebase',
      context: {
        description: args.description,
        magicNumbers: args.magicNumbers,
        projectRoot: '/home/urisha/Desktop/workspace/FractalEngine'
      },
      instructions: [
        '1. Create src/constants.ts with: SIDEBAR_WIDTH_PX=350, TILE_HEIGHT_PX=96, DEFAULT_CANVAS_WIDTH=1024, DEFAULT_CANVAS_HEIGHT=768, RESIZE_DEBOUNCE_MS=300, LSYSTEM_MARGIN_PX=40, NEWTON_CONVERGENCE_THRESHOLD=0.001, DEFAULT_MAX_ITERATIONS=256, DEFAULT_ESCAPE_RADIUS=2.0, PAN_STEP_BASE=0.1, ZOOM_STEP_FACTOR=1.1, ZOOM_MIN=0.1, ZOOM_MAX=10',
        '2. Update src/main.ts to use SIDEBAR_WIDTH_PX and RESIZE_DEBOUNCE_MS',
        '3. Update src/renderer/FractalRenderer.ts to use TILE_HEIGHT_PX, DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT',
        '4. Update src/ui/UIController.ts (or EventBindings.ts) to use PAN_STEP_BASE, ZOOM_STEP_FACTOR',
        '5. Update fractal files to use NEWTON_CONVERGENCE_THRESHOLD, LSYSTEM_MARGIN_PX',
        '6. Run npm test and npx tsc --noEmit',
        '7. Return summary'
      ],
      outputFormat: 'JSON with filesCreated, filesModified, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'summary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['milestone-a', 'refactoring', 'constants']
}));

export const cleanDeadCodeTask = defineTask('clean-dead-code', (args, taskCtx) => ({
  kind: 'agent',
  title: 'A5: Remove dead code + add error handling',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior TypeScript engineer',
      task: 'Remove dead code and add proper error handling guards',
      context: {
        description: args.description,
        projectRoot: '/home/urisha/Desktop/workspace/FractalEngine'
      },
      instructions: [
        '1. Read FractalEngine.ts, FractalRenderer.ts, UIController.ts, main.ts, WorkerPool.ts',
        '2. Remove FractalEngine.exportAsImage() — returns empty Blob placeholder, never called',
        '3. Remove FractalRenderer.exportAsImage() — broken camera setup, never called',
        '4. Remove FractalRenderer.setZoom() — never called, zoom handled via coordinate transform',
        '5. Add null guard on getContext("2d") in FractalRenderer constructor',
        '6. Add null blob handling in UIController export (toBlob callback)',
        '7. Add null check on document.getElementById("canvas") in main.ts',
        '8. Add diagnostic info to WorkerPool catch block',
        '9. Run npm test and npx tsc --noEmit',
        '10. Return summary'
      ],
      outputFormat: 'JSON with filesModified, summary, deadCodeRemoved (array), guardsAdded (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'summary'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        deadCodeRemoved: { type: 'array', items: { type: 'string' } },
        guardsAdded: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['milestone-a', 'refactoring', 'cleanup']
}));

export const createCIPipelineTask = defineTask('create-ci-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: 'A6: Create CI/CD pipeline',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps engineer',
      task: 'Create GitHub Actions CI pipeline',
      context: {
        description: args.description,
        projectRoot: '/home/urisha/Desktop/workspace/FractalEngine'
      },
      instructions: [
        '1. Create .github/workflows/ci.yml',
        '2. Trigger on push and pull_request to main',
        '3. Steps: checkout, setup Node 20, npm ci, npm run type-check, npm test, npm run build',
        '4. Cache node_modules via actions/cache',
        '5. Verify YAML syntax is valid',
        '6. Return summary'
      ],
      outputFormat: 'JSON with filesCreated, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'summary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['milestone-a', 'devops', 'ci']
}));

// --- Milestone B Tasks ---

export const responsiveLayoutTask = defineTask('responsive-layout', (args, taskCtx) => ({
  kind: 'agent',
  title: 'B1: Responsive layout system',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior frontend engineer specializing in responsive web design',
      task: 'Implement responsive layout with breakpoints for desktop, tablet, and mobile',
      context: {
        description: args.description,
        files: args.files,
        projectRoot: '/home/urisha/Desktop/workspace/FractalEngine',
        planReference: 'See /home/urisha/.claude/plans/cheerful-snacking-bumblebee.md section B1'
      },
      instructions: [
        '1. Read index.html and src/main.ts completely',
        '2. Add CSS media queries in index.html: desktop >=1024px (current sidebar), tablet 600-1023px (collapsible right overlay, hamburger toggle), mobile <600px (bottom drawer, FAB toggle)',
        '3. Use CSS custom properties for sidebar width',
        '4. Add toggle button element (hamburger/FAB) that is display:none on desktop',
        '5. Canvas uses flex:1 width:100% height:100vh on tablet/mobile',
        '6. Modify main.ts: remove hardcoded -350, use matchMedia for breakpoint-aware canvas sizing',
        '7. Add CSS transitions for sidebar open/close animations',
        '8. Run npm run type-check && npm test',
        '9. Return summary'
      ],
      outputFormat: 'JSON with filesCreated, filesModified, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'summary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['milestone-b', 'mobile', 'layout']
}));

export const touchGesturesTask = defineTask('touch-gestures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'B2: Touch gesture support',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior frontend engineer with mobile touch interaction expertise',
      task: 'Create TouchHandler module with pinch-to-zoom, single-finger pan, and double-tap reset',
      context: {
        description: args.description,
        integration: args.integration,
        projectRoot: '/home/urisha/Desktop/workspace/FractalEngine'
      },
      instructions: [
        '1. Create src/ui/TouchHandler.ts',
        '2. Implement pinch-to-zoom: track 2 touches, compute scale delta from distance change between touchstart and touchmove, map to zoom factor',
        '3. Implement single-finger pan: track single touch drag, convert pixel delta to fractal coordinate delta (inversely proportional to zoom)',
        '4. Implement double-tap reset: detect 2 taps within 300ms, trigger reset',
        '5. Accept callback interface: { onZoom(factor): void, onPan(dx, dy): void, onReset(): void }',
        '6. Set touch-action:none on canvas element',
        '7. Use { passive: false } on touchmove to allow preventDefault()',
        '8. Wire into UIController or EventBindings',
        '9. Run npm run type-check && npm test',
        '10. Return summary'
      ],
      outputFormat: 'JSON with filesCreated, filesModified, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'summary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['milestone-b', 'mobile', 'touch']
}));

export const responsiveControlsTask = defineTask('responsive-controls', (args, taskCtx) => ({
  kind: 'agent',
  title: 'B3: Responsive controls layout',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior frontend engineer',
      task: 'Make UI controls responsive with proper touch targets and mobile-friendly layout',
      context: { description: args.description, projectRoot: '/home/urisha/Desktop/workspace/FractalEngine' },
      instructions: [
        '1. Update CSS in index.html for touch targets >=44px height (WCAG)',
        '2. Buttons become full-width with 48px min height on mobile',
        '3. Add drag handle at top of bottom drawer for mobile',
        '4. Promote Render button to FAB overlay on mobile',
        '5. Use CSS grid with minmax() for fluid control layout',
        '6. Run npm run type-check',
        '7. Return summary'
      ],
      outputFormat: 'JSON with filesModified, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'summary'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['milestone-b', 'mobile', 'controls']
}));

export const viewportResolutionTask = defineTask('viewport-resolution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'B4: Viewport-aware canvas resolution',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior graphics engineer',
      task: 'Add devicePixelRatio support and optimal resolution calculation for mobile',
      context: { description: args.description, file: args.file, projectRoot: '/home/urisha/Desktop/workspace/FractalEngine' },
      instructions: [
        '1. Read src/renderer/FractalRenderer.ts',
        '2. Add getOptimalResolution(): {width, height} method — Math.min(devicePixelRatio, 2) * viewport dimensions',
        '3. On mobile (<600px), reduce default maxIterations by 50% for performance',
        '4. Modify src/main.ts resize handler to use getOptimalResolution()',
        '5. Run npm run type-check && npm test',
        '6. Return summary'
      ],
      outputFormat: 'JSON with filesModified, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'summary'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['milestone-b', 'mobile', 'resolution']
}));

// --- Milestone C Tasks ---

export const colorParamsTask = defineTask('color-params', (args, taskCtx) => ({
  kind: 'agent',
  title: 'C1: Enhanced color parameter system',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior TypeScript engineer with graphics programming expertise',
      task: 'Create color parameter system with hue offset, saturation, brightness, contrast, and cycle speed',
      context: { description: args.description, newFiles: args.newFiles, modifyFiles: args.modifyFiles, projectRoot: '/home/urisha/Desktop/workspace/FractalEngine' },
      instructions: [
        '1. Create src/colors/ColorParams.ts with ColorParams interface and DEFAULT_COLOR_PARAMS',
        '2. Modify src/colors/colorMapping.ts: all mapping functions accept optional ColorParams. cycleSpeed multiplies t, hueOffset shifts hue, saturation/brightness scale S/L channels, contrast applies sigmoid',
        '3. Modify src/workers/fractal.worker.ts: TileTask gains colorParams field, pass to mapColorByName',
        '4. Modify src/engine/FractalEngine.ts: add colorParams field, setColorParams/getColorParams methods',
        '5. Modify src/ui/ControlsPanel.ts: add "Color Adjustments" control group with 5 range sliders',
        '6. Wire slider events in EventBindings.ts',
        '7. Create src/__tests__/colorParams.test.ts with ~10 tests',
        '8. Run npm test && npx tsc --noEmit',
        '9. Return summary'
      ],
      outputFormat: 'JSON with filesCreated, filesModified, summary, testsPassed'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'summary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        testsPassed: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['milestone-c', 'color-system', 'parameters']
}));

export const gradientEditorTask = defineTask('gradient-editor', (args, taskCtx) => ({
  kind: 'agent',
  title: 'C2: Custom gradient editor',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior frontend + graphics engineer',
      task: 'Create gradient interpolation logic and gradient editor UI with 2-4 color stops',
      context: { description: args.description, newFiles: args.newFiles, projectRoot: '/home/urisha/Desktop/workspace/FractalEngine' },
      instructions: [
        '1. Create src/colors/GradientEditor.ts: GradientStop interface (position 0-1, color {r,g,b}), interpolateGradient(t, stops) pure function with linear interpolation',
        '2. Add mapWithGradient(iterations, maxIterations, stops, colorParams) to colorMapping.ts',
        '3. Modify fractal.worker.ts: TileTask gains optional gradientStops array, use mapWithGradient when present',
        '4. Create src/ui/GradientEditorUI.ts: 2-4 color stops with <input type="color"> pickers and position sliders, add/remove stop buttons (min 2, max 4), "Use Custom Gradient" checkbox, live preview strip canvas',
        '5. Wire into ControlsPanel and EventBindings',
        '6. Create src/__tests__/gradient.test.ts with ~8 tests: 2-stop linear, 4-stop multi-segment, position=0 and position=1 edges',
        '7. Run npm test && npx tsc --noEmit',
        '8. Return summary'
      ],
      outputFormat: 'JSON with filesCreated, filesModified, summary, testsPassed'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'summary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        testsPassed: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['milestone-c', 'color-system', 'gradient']
}));

export const shapeBoundariesTask = defineTask('shape-boundaries', (args, taskCtx) => ({
  kind: 'agent',
  title: 'C3: Shape boundaries — basic shapes',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior engineer with computational geometry expertise',
      task: 'Create shape boundary system with oval, triangle, rectangle including mask and distortion modes',
      context: { description: args.description, newFiles: args.newFiles, projectRoot: '/home/urisha/Desktop/workspace/FractalEngine' },
      instructions: [
        '1. Create src/boundaries/ShapeBoundary.ts: ShapeType (none|oval|triangle|rectangle), BoundaryMode (mask|distortion), ShapeConfig interface, isInsideShape(nx, ny, config) function, distortCoordinates(nx, ny, config) function',
        '2. Oval: (nx/aspect)^2 + ny^2 <= 1',
        '3. Triangle: barycentric test with rounded vertices (lerp vertex toward centroid by roundness)',
        '4. Rectangle: abs(nx) <= aspect && abs(ny) <= 1 with corner rounding via SDF roundedBox',
        '5. Create src/boundaries/DistortionLUT.ts: buildLUT(config) returning 720-entry Float32Array (0.5-degree resolution), used by distortCoordinates for polar radial remapping',
        '6. Modify fractal.worker.ts: TileTask gains optional shapeConfig, mask mode skips outside pixels (black), distortion mode calls distortCoordinates before computePoint',
        '7. Add shape dropdown, mode toggle, aspect ratio slider, roundness slider to ControlsPanel',
        '8. Create src/__tests__/boundaries.test.ts with ~12 tests',
        '9. Run npm test && npx tsc --noEmit',
        '10. Return summary'
      ],
      outputFormat: 'JSON with filesCreated, filesModified, summary, testsPassed'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'summary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        testsPassed: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['milestone-c', 'boundaries', 'shapes']
}));

export const chessPiecesTask = defineTask('chess-pieces', (args, taskCtx) => ({
  kind: 'agent',
  title: 'C4: Chess piece silhouettes',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior engineer with SDF and computational geometry expertise',
      task: 'Create 6 chess piece silhouettes using SDF/polygon techniques for fractal boundary clipping',
      context: { description: args.description, newFile: args.newFile, dependsOn: args.dependsOn, projectRoot: '/home/urisha/Desktop/workspace/FractalEngine' },
      instructions: [
        '1. Read src/boundaries/ShapeBoundary.ts to understand the existing system',
        '2. Create src/boundaries/ChessPieces.ts with pure functions in normalized [-1,1] space:',
        '3. Pawn: SDF union of 3 circles (head, neck, base) + rounded rectangle pedestal',
        '4. Rook: SDF rectangle body + 3 rectangular crenellations + rectangular base',
        '5. Bishop: SDF tapered body (trapezoid) + pointed top (triangle) + mitre ball (circle)',
        '6. Knight: polygon silhouette ~20 vertices with winding-number point-in-polygon test',
        '7. Queen: SDF tapered body + 5 triangular crown points (angle modulo)',
        '8. King: same as queen body + cross (union of 2 thin rectangles)',
        '9. Each exports isInsidePiece(nx, ny): boolean',
        '10. Extend ShapeType in ShapeBoundary.ts to include pawn|rook|bishop|knight|queen|king, delegate isInsideShape to chess functions. Hide aspect/roundness controls for chess pieces in UI. Build distortion LUT from piece contour.',
        '11. Create src/__tests__/chessPieces.test.ts with ~14 tests (2 per piece + 2 general)',
        '12. Run npm test && npx tsc --noEmit'
      ],
      outputFormat: 'JSON with filesCreated, filesModified, summary, testsPassed'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'summary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        testsPassed: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['milestone-c', 'boundaries', 'chess']
}));

export const integrationPolishTask = defineTask('integration-polish', (args, taskCtx) => ({
  kind: 'agent',
  title: 'C5: Integration and polish',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior full-stack engineer and integration specialist',
      task: 'Wire all Phase 3 features together, handle edge cases, add collapsible controls, optimize performance',
      context: { description: args.description, scope: args.scope, projectRoot: '/home/urisha/Desktop/workspace/FractalEngine' },
      instructions: [
        '1. Wire all new controls (color params, gradient, shapes, chess pieces) into EventBindings.ts',
        '2. Handle L-System + shape boundaries: mask mode uses ctx.clip() before L-System render, distortion mode disabled for L-Systems (hide toggle or show warning)',
        '3. Add collapsible control groups: each section header (<h3>) toggles visibility on click',
        '4. Performance: precompute distortion LUT once on shape config change, pass as Float32Array in TileTask',
        '5. Verify bundle size stays under 500KB with npm run build',
        '6. Test all combinations: each fractal type × each color scheme × shapes × modes',
        '7. Run full test suite: npm test',
        '8. Run npm run type-check',
        '9. Verify the app works end-to-end with npm run dev',
        '10. Return comprehensive summary'
      ],
      outputFormat: 'JSON with filesModified, summary, bundleSize, allTestsPassed'
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'summary'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        bundleSize: { type: 'string' },
        allTestsPassed: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['milestone-c', 'integration', 'polish']
}));

// --- Shared Tasks ---

export const verifyMilestoneTask = defineTask('verify-milestone', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify milestone ${args.milestone}: ${args.milestoneName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior QA engineer',
      task: `Run verification for milestone ${args.milestone} and report results`,
      context: {
        milestone: args.milestone,
        milestoneName: args.milestoneName,
        verifyCommand: args.verifyCommand,
        expectedMinTests: args.expectedMinTests,
        projectRoot: '/home/urisha/Desktop/workspace/FractalEngine'
      },
      instructions: [
        `1. Run: ${args.verifyCommand}`,
        `2. Verify at least ${args.expectedMinTests} tests pass`,
        '3. Check for TypeScript errors (zero expected)',
        '4. Run npm run build to verify production build succeeds',
        '5. Report: tests passed count, type errors count, build success, any issues found',
        '6. Return structured verification report'
      ],
      outputFormat: 'JSON with verified (boolean), testsPassed (number), typeErrors (number), buildSuccess (boolean), issues (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'testsPassed'],
      properties: {
        verified: { type: 'boolean' },
        testsPassed: { type: 'number' },
        typeErrors: { type: 'number' },
        buildSuccess: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['verification', `milestone-${args.milestone}`]
}));

export const qualityScoringTask = defineTask('quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Score quality: Milestone ${args.milestone} (iter ${args.iteration})`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior QA engineer and code reviewer',
      task: `Score the quality of milestone ${args.milestone} implementation against acceptance criteria`,
      context: {
        milestone: args.milestone,
        milestoneName: args.milestoneName,
        criteria: args.criteria,
        targetQuality: args.targetQuality,
        iteration: args.iteration,
        projectRoot: '/home/urisha/Desktop/workspace/FractalEngine'
      },
      instructions: [
        '1. Read the relevant source files for this milestone',
        '2. Run npm test and npm run type-check to get current state',
        '3. Score each criterion from 0-100',
        '4. Calculate weighted overall score',
        '5. Identify critical issues that must be fixed',
        '6. Provide specific, actionable recommendations',
        '7. Return structured quality report'
      ],
      outputFormat: 'JSON with score (0-100), criteriaScores (array), feedback (string), recommendations (array), criticalIssues (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'feedback'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        criteriaScores: { type: 'array', items: { type: 'object' } },
        feedback: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } },
        criticalIssues: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quality-scoring', `milestone-${args.milestone}`, `iteration-${args.iteration}`]
}));

export const fixIssuesTask = defineTask('fix-issues', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix issues: Milestone ${args.milestone} (iter ${args.iteration})`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior engineer',
      task: `Fix quality issues found in milestone ${args.milestone} iteration ${args.iteration}`,
      context: {
        milestone: args.milestone,
        feedback: args.feedback,
        recommendations: args.recommendations,
        projectRoot: '/home/urisha/Desktop/workspace/FractalEngine'
      },
      instructions: [
        '1. Review the feedback and recommendations carefully',
        '2. Fix each identified issue in priority order',
        '3. Run npm test after each fix to ensure no regressions',
        '4. Run npx tsc --noEmit to verify type safety',
        '5. Return summary of fixes applied'
      ],
      outputFormat: 'JSON with filesModified, fixesApplied (array), summary, testsPassed, typeCheckPassed'
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'summary'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        fixesApplied: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        testsPassed: { type: 'boolean' },
        typeCheckPassed: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fix-issues', `milestone-${args.milestone}`, `iteration-${args.iteration}`]
}));

export const finalReviewTask = defineTask('final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final review — all milestones',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Principal engineer and technical reviewer',
      task: 'Conduct final comprehensive review of the entire Phase 3 implementation across all 3 milestones',
      context: {
        milestones: args.milestones,
        qualities: args.qualities,
        targetQuality: args.targetQuality,
        projectRoot: '/home/urisha/Desktop/workspace/FractalEngine'
      },
      instructions: [
        '1. Run full test suite: npm test',
        '2. Run type check: npx tsc --noEmit',
        '3. Run production build: npm run build — check bundle size < 500KB',
        '4. Review each milestone quality score',
        '5. Verify no color duplication remains',
        '6. Verify mobile responsive layout works',
        '7. Verify all Phase 3 features are functional',
        '8. Provide final verdict and approval recommendation',
        '9. Identify any follow-up tasks'
      ],
      outputFormat: 'JSON with verdict (string), approved (boolean), confidence (0-100), strengths (array), concerns (array), followUpTasks (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['verdict', 'approved', 'confidence'],
      properties: {
        verdict: { type: 'string' },
        approved: { type: 'boolean' },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        strengths: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } },
        followUpTasks: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['final-review']
}));
