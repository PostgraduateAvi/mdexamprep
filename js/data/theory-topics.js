// Theory Topics — Harrison's chapter-based nodes per system
(function() {
  'use strict';

  window.TheoryTopics = {
    cardiology: {
      nodes: [
        { id: 'cardio-root', label: 'Cardiology', type: 'category' },
        { id: 'hf', label: 'Heart Failure', type: 'topic' },
        { id: 'arrhythmias', label: 'Arrhythmias', type: 'topic' },
        { id: 'valvular', label: 'Valvular Disease', type: 'topic' },
        { id: 'cad', label: 'Coronary Artery Disease', type: 'topic' },
        { id: 'htn', label: 'Hypertension', type: 'topic' },
        { id: 'cardiomyopathy', label: 'Cardiomyopathy', type: 'topic' },
        { id: 'ecg', label: 'ECG Interpretation', type: 'topic' },
        { id: 'pericardial', label: 'Pericardial Disease', type: 'topic' },
        { id: 'congenital', label: 'Congenital HD', type: 'topic' }
      ],
      links: [
        { source: 'cardio-root', target: 'hf' },
        { source: 'cardio-root', target: 'arrhythmias' },
        { source: 'cardio-root', target: 'valvular' },
        { source: 'cardio-root', target: 'cad' },
        { source: 'cardio-root', target: 'htn' },
        { source: 'cardio-root', target: 'cardiomyopathy' },
        { source: 'cardio-root', target: 'ecg' },
        { source: 'cardio-root', target: 'pericardial' },
        { source: 'cardio-root', target: 'congenital' },
        { source: 'hf', target: 'cardiomyopathy' },
        { source: 'cad', target: 'ecg' },
        { source: 'arrhythmias', target: 'ecg' }
      ]
    },
    respiratory: {
      nodes: [
        { id: 'resp-root', label: 'Respiratory', type: 'category' },
        { id: 'asthma', label: 'Asthma', type: 'topic' },
        { id: 'copd', label: 'COPD', type: 'topic' },
        { id: 'pneumonia', label: 'Pneumonia', type: 'topic' },
        { id: 'ild', label: 'ILD', type: 'topic' },
        { id: 'pleural', label: 'Pleural Disease', type: 'topic' },
        { id: 'pe', label: 'Pulmonary Embolism', type: 'topic' },
        { id: 'lung-ca', label: 'Lung Cancer', type: 'topic' },
        { id: 'tb-resp', label: 'Pulmonary TB', type: 'topic' }
      ],
      links: [
        { source: 'resp-root', target: 'asthma' },
        { source: 'resp-root', target: 'copd' },
        { source: 'resp-root', target: 'pneumonia' },
        { source: 'resp-root', target: 'ild' },
        { source: 'resp-root', target: 'pleural' },
        { source: 'resp-root', target: 'pe' },
        { source: 'resp-root', target: 'lung-ca' },
        { source: 'resp-root', target: 'tb-resp' },
        { source: 'asthma', target: 'copd' },
        { source: 'pneumonia', target: 'tb-resp' }
      ]
    },
    gi: {
      nodes: [
        { id: 'gi-root', label: 'Gastroenterology', type: 'category' },
        { id: 'peptic', label: 'Peptic Ulcer Disease', type: 'topic' },
        { id: 'ibd', label: 'IBD', type: 'topic' },
        { id: 'cirrhosis', label: 'Cirrhosis', type: 'topic' },
        { id: 'hepatitis', label: 'Hepatitis', type: 'topic' },
        { id: 'pancreatitis', label: 'Pancreatitis', type: 'topic' },
        { id: 'gi-bleed', label: 'GI Bleeding', type: 'topic' },
        { id: 'malabsorption', label: 'Malabsorption', type: 'topic' }
      ],
      links: [
        { source: 'gi-root', target: 'peptic' },
        { source: 'gi-root', target: 'ibd' },
        { source: 'gi-root', target: 'cirrhosis' },
        { source: 'gi-root', target: 'hepatitis' },
        { source: 'gi-root', target: 'pancreatitis' },
        { source: 'gi-root', target: 'gi-bleed' },
        { source: 'gi-root', target: 'malabsorption' },
        { source: 'cirrhosis', target: 'hepatitis' },
        { source: 'peptic', target: 'gi-bleed' }
      ]
    },
    neurology: {
      nodes: [
        { id: 'neuro-root', label: 'Neurology', type: 'category' },
        { id: 'stroke', label: 'Stroke', type: 'topic' },
        { id: 'epilepsy', label: 'Epilepsy', type: 'topic' },
        { id: 'movement', label: 'Movement Disorders', type: 'topic' },
        { id: 'demyelinating', label: 'Demyelinating Disease', type: 'topic' },
        { id: 'neuromuscular', label: 'Neuromuscular', type: 'topic' },
        { id: 'cranial-nerves', label: 'Cranial Nerves', type: 'topic' },
        { id: 'meningitis', label: 'Meningitis', type: 'topic' },
        { id: 'headache', label: 'Headache Syndromes', type: 'topic' }
      ],
      links: [
        { source: 'neuro-root', target: 'stroke' },
        { source: 'neuro-root', target: 'epilepsy' },
        { source: 'neuro-root', target: 'movement' },
        { source: 'neuro-root', target: 'demyelinating' },
        { source: 'neuro-root', target: 'neuromuscular' },
        { source: 'neuro-root', target: 'cranial-nerves' },
        { source: 'neuro-root', target: 'meningitis' },
        { source: 'neuro-root', target: 'headache' },
        { source: 'stroke', target: 'cranial-nerves' }
      ]
    },
    nephrology: {
      nodes: [
        { id: 'neph-root', label: 'Nephrology', type: 'category' },
        { id: 'aki', label: 'AKI', type: 'topic', url: 'Textbooks/Main/Nephrology/Nephrology_Study_Guide_Harrison_21e.md' },
        { id: 'ckd', label: 'CKD', type: 'topic', url: 'Textbooks/Main/Nephrology/Nephrology_Study_Guide_Harrison_21e.md' },
        { id: 'gn', label: 'Glomerulonephritis', type: 'topic', url: 'Textbooks/Main/Nephrology/Nephrology_Study_Guide_Harrison_21e.md' },
        { id: 'nephrotic', label: 'Nephrotic Syndrome', type: 'topic', url: 'Textbooks/Main/Nephrology/Nephrology_Study_Guide_Harrison_21e.md' },
        { id: 'electrolytes', label: 'Electrolyte Disorders', type: 'topic', url: 'Textbooks/Main/Nephrology/Nephrology_Study_Guide_Harrison_21e.md' },
        { id: 'rrt', label: 'Renal Replacement', type: 'topic' },
        { id: 'stones', label: 'Nephrolithiasis', type: 'topic' }
      ],
      links: [
        { source: 'neph-root', target: 'aki' },
        { source: 'neph-root', target: 'ckd' },
        { source: 'neph-root', target: 'gn' },
        { source: 'neph-root', target: 'nephrotic' },
        { source: 'neph-root', target: 'electrolytes' },
        { source: 'neph-root', target: 'rrt' },
        { source: 'neph-root', target: 'stones' },
        { source: 'aki', target: 'ckd' },
        { source: 'gn', target: 'nephrotic' },
        { source: 'ckd', target: 'rrt' }
      ]
    },
    endocrinology: {
      nodes: [
        { id: 'endo-root', label: 'Endocrinology', type: 'category' },
        { id: 'dm', label: 'Diabetes Mellitus', type: 'topic', url: 'Textbooks/Main/Endocrinology/Endocrinology_Study_Guide_Harrison_21e.md' },
        { id: 'thyroid', label: 'Thyroid Disorders', type: 'topic', url: 'Textbooks/Main/Endocrinology/Endocrinology_Study_Guide_Harrison_21e.md' },
        { id: 'adrenal', label: 'Adrenal Disorders', type: 'topic', url: 'Textbooks/Main/Endocrinology/Endocrinology_Study_Guide_Harrison_21e.md' },
        { id: 'pituitary', label: 'Pituitary', type: 'topic', url: 'Textbooks/Main/Endocrinology/Endocrinology_Study_Guide_Harrison_21e.md' },
        { id: 'bone', label: 'Bone & Mineral', type: 'topic', url: 'Textbooks/Main/Endocrinology/Endocrinology_Study_Guide_Harrison_21e.md' },
        { id: 'gonadal', label: 'Reproductive Endo', type: 'topic', url: 'Textbooks/Main/Endocrinology/Endocrinology_Study_Guide_Harrison_21e.md' },
        { id: 'obesity', label: 'Obesity & Lipids', type: 'topic' }
      ],
      links: [
        { source: 'endo-root', target: 'dm' },
        { source: 'endo-root', target: 'thyroid' },
        { source: 'endo-root', target: 'adrenal' },
        { source: 'endo-root', target: 'pituitary' },
        { source: 'endo-root', target: 'bone' },
        { source: 'endo-root', target: 'gonadal' },
        { source: 'endo-root', target: 'obesity' },
        { source: 'pituitary', target: 'adrenal' },
        { source: 'pituitary', target: 'thyroid' },
        { source: 'dm', target: 'obesity' }
      ]
    },
    hematology: {
      nodes: [
        { id: 'heme-root', label: 'Hematology', type: 'category' },
        { id: 'ida', label: 'Iron Deficiency Anemia', type: 'topic' },
        { id: 'hemolytic', label: 'Hemolytic Anemias', type: 'topic' },
        { id: 'leukemia', label: 'Leukemias', type: 'topic' },
        { id: 'lymphoma', label: 'Lymphomas', type: 'topic' },
        { id: 'myeloma', label: 'Multiple Myeloma', type: 'topic' },
        { id: 'coag', label: 'Coagulation Disorders', type: 'topic' },
        { id: 'transfusion', label: 'Transfusion Medicine', type: 'topic' },
        { id: 'mpn', label: 'Myeloproliferative', type: 'topic' }
      ],
      links: [
        { source: 'heme-root', target: 'ida' },
        { source: 'heme-root', target: 'hemolytic' },
        { source: 'heme-root', target: 'leukemia' },
        { source: 'heme-root', target: 'lymphoma' },
        { source: 'heme-root', target: 'myeloma' },
        { source: 'heme-root', target: 'coag' },
        { source: 'heme-root', target: 'transfusion' },
        { source: 'heme-root', target: 'mpn' },
        { source: 'leukemia', target: 'mpn' },
        { source: 'coag', target: 'transfusion' }
      ]
    },
    id: {
      nodes: [
        { id: 'id-root', label: 'Infectious Diseases', type: 'category' },
        { id: 'lepto', label: 'Leptospirosis', type: 'topic', url: 'id-dashboard.html' },
        { id: 'nipah', label: 'Nipah Virus', type: 'topic', url: 'id-dashboard.html' },
        { id: 'scrub', label: 'Scrub Typhus', type: 'topic', url: 'id-dashboard.html' },
        { id: 'dengue', label: 'Dengue', type: 'topic', url: 'id-dashboard.html' },
        { id: 'tb', label: 'Tuberculosis', type: 'topic', url: 'id-dashboard.html' },
        { id: 'hiv', label: 'HIV/AIDS', type: 'topic', url: 'id-dashboard.html' },
        { id: 'enteric', label: 'Enteric Fever', type: 'topic', url: 'id-dashboard.html' },
        { id: 'malaria', label: 'Malaria', type: 'topic' },
        { id: 'amr', label: 'AMR & Stewardship', type: 'topic', url: 'id-dashboard.html' }
      ],
      links: [
        { source: 'id-root', target: 'lepto' },
        { source: 'id-root', target: 'nipah' },
        { source: 'id-root', target: 'scrub' },
        { source: 'id-root', target: 'dengue' },
        { source: 'id-root', target: 'tb' },
        { source: 'id-root', target: 'hiv' },
        { source: 'id-root', target: 'enteric' },
        { source: 'id-root', target: 'malaria' },
        { source: 'id-root', target: 'amr' },
        { source: 'tb', target: 'hiv' }
      ]
    }
  };
})();
