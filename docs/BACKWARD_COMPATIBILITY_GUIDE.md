# Backward Compatibility Guide - Configurable Evaluation System

## Overview
The configurable evaluation system was designed with backward compatibility as a core principle. All existing consultation data continues to work without migration.

## Compatibility Strategy

### 1. Data Model Compatibility

#### Flexible Interfaces with Fixed Properties
All data models support **both** old fixed structure and new dynamic structure:

**IFolds** ([consulta.ts:17-28](../src/domain/entities/consulta.ts#L17-L28))
```typescript
export interface IFolds {
  // Fixed JP7 properties (backward compatible) - OPTIONAL
  abdominal?: number;
  axilar?: number;
  coxa?: number;
  peitoral?: number;
  subescapular?: number;
  supra?: number;
  triceps?: number;

  // Dynamic properties for custom protocols - NEW
  [foldId: string]: number | undefined;
}
```

**Why This Works:**
- ✅ Old consultas with JP7 data still type-check
- ✅ New consultas can use any fold IDs
- ✅ No runtime errors accessing old properties
- ✅ TypeScript remains happy

**IMeasures** ([consulta.ts:40-55](../src/domain/entities/consulta.ts#L40-L55))
```typescript
export interface IMeasures {
  // Fixed measure properties (backward compatible) - OPTIONAL
  circ_abdomen?: number;
  circ_braco_dir?: number;
  // ... all 11 measures

  // Dynamic properties for custom measures - NEW
  [measureId: string]: number | undefined;
}
```

### 2. Display Component Compatibility

#### CompositionInfo.tsx
**Before Phase 4:**
```typescript
if (!consulta || !consulta.results) return;
// Only showed JP7 calculated results
```

**After Phase 4:**
```typescript
if (!consulta || (!consulta.results && !consulta.bioimpedance)) return;
// Shows BOTH formula results AND bioimpedance
// Shows protocol badge if evaluationProtocol exists
```

**Compatibility:**
- ✅ Old consultas without `bioimpedance` → shows only formula results (as before)
- ✅ Old consultas without `evaluationProtocol` → no badge shown
- ✅ New consultas with bioimpedance → shows both sections
- ✅ Patient submissions → shows "PATIENT_SUBMITTED" badge

### 3. Calculation Compatibility

#### Existing MultiStepEvaluationFormContext
**Current Calculation** ([MultiStepEvaluationFormContext.tsx:102-152](../src/components/Consultas/context/MultiStepEvaluationFormContext.tsx#L102-L152))
- Hardcoded JP7 formula for men and women
- Uses fixed property names: `folds.triceps`, `folds.peitoral`, etc.
- Calculates: density, fat%, mg, mm, mo, mr

**Phase 5 BodyCompositionService**
- Flexible protocol selection (JP3, JP7, DW4)
- Accepts any fold property names
- Same JP7 formula as existing system (verified)

**Compatibility:**
- ✅ Existing evaluation drawer continues to work
- ✅ JP7 calculations produce identical results
- ✅ New calculator component provides additional protocols
- ✅ Can gradually migrate to new service

### 4. Form Submission Compatibility

#### Public Form System (Phase 3)
**Patient-Submitted Data:**
```typescript
// Stored with special protocol marker
{
  evaluationData: { weight, height, measures, photos },
  evaluationProtocol: "patient_submitted"
}
```

**Professional-Entered Data:**
```typescript
// Stored with formula protocol (or undefined for old data)
{
  dobras: { triceps: 12, ... },
  results: { dobras: 98, fat: 19.68, ... },
  evaluationProtocol: "jp7" // or undefined for legacy
}
```

**Compatibility:**
- ✅ Old consultas without `evaluationProtocol` → treated as JP7 (current default)
- ✅ New consultas store which protocol was used
- ✅ Patient submissions clearly marked
- ✅ Display logic handles all cases

## Migration Paths

### Option 1: No Migration Required (Recommended)
**Current Status:** Fully backward compatible

- Keep existing consultas as-is
- They continue to display correctly
- New consultas use enhanced features
- No data migration needed

**Pros:**
- Zero risk
- No downtime
- Immediate rollout
- Gradual adoption

**Cons:**
- Mixed data formats (not really a problem with current design)

### Option 2: Gradual Protocol Marking (Optional)
Add `evaluationProtocol` to existing consultas on read:

```typescript
// In ConsultaService or conversion layer
const enhanceConsultaWithProtocol = (consulta: IConsultaFirebase) => {
  // If old consulta has JP7 folds but no protocol marked
  if (consulta.dobras && !consulta.evaluationProtocol) {
    const hasJP7Folds =
      consulta.dobras.triceps !== undefined &&
      consulta.dobras.peitoral !== undefined &&
      // ... check all 7 folds

    return {
      ...consulta,
      evaluationProtocol: hasJP7Folds ? "jp7" : "custom"
    };
  }
  return consulta;
};
```

**Pros:**
- Clearer which protocol was used historically
- Better analytics on protocol usage

**Cons:**
- Read-time overhead
- Not necessary for functionality

### Option 3: Background Migration Script (Not Recommended)
One-time Firestore update to add `evaluationProtocol: "jp7"` to all old consultas.

**Not recommended because:**
- ❌ Risk of data corruption
- ❌ Requires careful testing
- ❌ No functional benefit (display works without it)
- ❌ Can't undo easily

## Verification Checklist

### Data Model Compatibility
- ✅ IFolds accepts both fixed and dynamic properties
- ✅ IMeasures accepts both fixed and dynamic properties
- ✅ IBioimpedance is entirely optional
- ✅ evaluationProtocol is optional

### Component Compatibility
- ✅ CompositionInfo handles missing bioimpedance
- ✅ CompositionInfo handles missing evaluationProtocol
- ✅ CompositionInfo shows both old and new data formats
- ✅ SetEvaluationDrawer continues to work with hardcoded JP7

### Calculation Compatibility
- ✅ JP7 formula in BodyCompositionService matches existing calculation
- ✅ Existing MultiStepEvaluationFormContext continues to work
- ✅ New calculator component can be used alongside existing form

### API Compatibility
- ✅ No breaking changes to existing endpoints
- ✅ New endpoints are additive only
- ✅ Form submission handles both old and new formats
- ✅ Form approval creates consultas with proper structure

## Testing Strategy

### Regression Testing
1. **Load Old Consultation**
   - Open existing consulta from before Phase 4
   - Verify all data displays correctly
   - Verify no errors in console
   - Check that results show (if they existed)

2. **Create New Consultation (Old Way)**
   - Use existing SetEvaluationDrawer
   - Enter JP7 fold data
   - Verify calculation works
   - Verify save works
   - Verify display works

3. **Create New Consultation (New Way)**
   - Use new BodyCompositionCalculator
   - Try different protocols (JP3, JP7, DW4)
   - Verify all calculations
   - Verify results save correctly

### Forward Compatibility Testing
1. **Patient Form Submission**
   - Submit form with evaluation data
   - Approve form
   - Verify consulta created correctly
   - Verify evaluationProtocol = "patient_submitted"

2. **Bioimpedance Entry** (when implemented)
   - Enter bioimpedance data
   - Verify saves correctly
   - Verify displays alongside formula results

## Rollback Plan

If issues arise, the system can be rolled back safely:

### Frontend Rollback
1. Revert CompositionInfo changes → shows only old results
2. Remove BodyCompositionCalculator imports → calculator hidden
3. Keep data models as-is → no data migration needed

### Backend Rollback
1. Remove `/calculate-body-composition` endpoint
2. Keep BodyCompositionService.ts for future use
3. No database changes to revert

### Partial Rollback
Can disable specific features:
- Hide calculator component
- Keep backward-compatible display
- Keep flexible data models
- Only use JP7 protocol

## Long-term Maintenance

### Adding New Protocols
1. Add formula to BodyCompositionService
2. Update protocol dropdown in calculator
3. Add to evaluation presets JSON
4. No changes needed to data models (already flexible)

### Removing Old Code (Future)
When confident all users are on new system:
1. Replace hardcoded JP7 in MultiStepEvaluationFormContext
2. Use BodyCompositionService for all calculations
3. Mark old calculation code as deprecated
4. Eventually remove after monitoring period

## Conclusion

**The system is 100% backward compatible by design.**

- ✅ No migration required
- ✅ No breaking changes
- ✅ Old data displays correctly
- ✅ Old forms continue to work
- ✅ New features enhance without replacing
- ✅ Safe to deploy immediately

The configurable evaluation system enhances existing functionality without disrupting current workflows.
