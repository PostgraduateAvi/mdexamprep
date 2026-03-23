// Practical Topics — Clinical examination nodes per system
(function() {
  'use strict';

  window.PracticalTopics = {
    cardiology: {
      nodes: [
        { id: 'cardio-px', label: 'Cardiovascular Exam', type: 'category' },
        { id: 'jvp', label: 'JVP Examination', type: 'topic' },
        { id: 'precordium', label: 'Precordium', type: 'topic' },
        { id: 'murmurs', label: 'Murmur ID', type: 'topic' },
        { id: 'peripheral-vasc', label: 'Peripheral Vascular', type: 'topic' },
        { id: 'bp-exam', label: 'BP & Pulse', type: 'topic' },
        { id: 'ecg-px', label: 'ECG Reading', type: 'topic' },
        { id: 'cardiac-auscult', label: 'Auscultation', type: 'topic' }
      ],
      links: [
        { source: 'cardio-px', target: 'jvp' },
        { source: 'cardio-px', target: 'precordium' },
        { source: 'cardio-px', target: 'murmurs' },
        { source: 'cardio-px', target: 'peripheral-vasc' },
        { source: 'cardio-px', target: 'bp-exam' },
        { source: 'cardio-px', target: 'ecg-px' },
        { source: 'cardio-px', target: 'cardiac-auscult' },
        { source: 'precordium', target: 'cardiac-auscult' },
        { source: 'cardiac-auscult', target: 'murmurs' }
      ]
    },
    respiratory: {
      nodes: [
        { id: 'resp-px', label: 'Respiratory Exam', type: 'category' },
        { id: 'resp-inspection', label: 'Inspection', type: 'topic' },
        { id: 'resp-palpation', label: 'Palpation', type: 'topic' },
        { id: 'resp-percussion', label: 'Percussion', type: 'topic' },
        { id: 'resp-auscultation', label: 'Auscultation', type: 'topic' },
        { id: 'abg', label: 'ABG Interpretation', type: 'topic' },
        { id: 'cxr', label: 'CXR Reading', type: 'topic' },
        { id: 'spirometry', label: 'Spirometry', type: 'topic' }
      ],
      links: [
        { source: 'resp-px', target: 'resp-inspection' },
        { source: 'resp-px', target: 'resp-palpation' },
        { source: 'resp-px', target: 'resp-percussion' },
        { source: 'resp-px', target: 'resp-auscultation' },
        { source: 'resp-px', target: 'abg' },
        { source: 'resp-px', target: 'cxr' },
        { source: 'resp-px', target: 'spirometry' },
        { source: 'resp-inspection', target: 'resp-palpation' },
        { source: 'resp-palpation', target: 'resp-percussion' },
        { source: 'resp-percussion', target: 'resp-auscultation' }
      ]
    },
    gi: {
      nodes: [
        { id: 'gi-px', label: 'Abdominal Exam', type: 'category' },
        { id: 'abd-inspection', label: 'Inspection', type: 'topic' },
        { id: 'abd-palpation', label: 'Palpation', type: 'topic' },
        { id: 'liver-palp', label: 'Liver Palpation', type: 'topic' },
        { id: 'spleen-palp', label: 'Spleen Palpation', type: 'topic' },
        { id: 'ascites', label: 'Ascites Assessment', type: 'topic' },
        { id: 'abd-auscult', label: 'Auscultation', type: 'topic' },
        { id: 'rectal', label: 'Rectal Exam', type: 'topic' }
      ],
      links: [
        { source: 'gi-px', target: 'abd-inspection' },
        { source: 'gi-px', target: 'abd-palpation' },
        { source: 'gi-px', target: 'liver-palp' },
        { source: 'gi-px', target: 'spleen-palp' },
        { source: 'gi-px', target: 'ascites' },
        { source: 'gi-px', target: 'abd-auscult' },
        { source: 'gi-px', target: 'rectal' },
        { source: 'abd-palpation', target: 'liver-palp' },
        { source: 'abd-palpation', target: 'spleen-palp' }
      ]
    },
    neurology: {
      nodes: [
        { id: 'neuro-px', label: 'Neurological Exam', type: 'category' },
        { id: 'cranial-n', label: 'Cranial Nerve Exam', type: 'topic', url: 'Textbooks/Main/Neurology/Neurology_Clinical_Examination.html' },
        { id: 'motor-exam', label: 'Motor Examination', type: 'topic', url: 'Textbooks/Main/Neurology/Neurology_Clinical_Examination.html' },
        { id: 'sensory-exam', label: 'Sensory Examination', type: 'topic', url: 'Textbooks/Main/Neurology/Neurology_Clinical_Examination.html' },
        { id: 'cerebellar', label: 'Cerebellar Exam', type: 'topic', url: 'Textbooks/Main/Neurology/Neurology_Clinical_Examination.html' },
        { id: 'gait', label: 'Gait Analysis', type: 'topic', url: 'Textbooks/Main/Neurology/Neurology_Clinical_Examination.html' },
        { id: 'reflex', label: 'Reflexes', type: 'topic', url: 'Textbooks/Main/Neurology/Neurology_Clinical_Examination.html' },
        { id: 'mental-status', label: 'Mental Status Exam', type: 'topic', url: 'Textbooks/Main/Neurology/Neurology_Clinical_Examination.html' }
      ],
      links: [
        { source: 'neuro-px', target: 'cranial-n' },
        { source: 'neuro-px', target: 'motor-exam' },
        { source: 'neuro-px', target: 'sensory-exam' },
        { source: 'neuro-px', target: 'cerebellar' },
        { source: 'neuro-px', target: 'gait' },
        { source: 'neuro-px', target: 'reflex' },
        { source: 'neuro-px', target: 'mental-status' },
        { source: 'motor-exam', target: 'reflex' },
        { source: 'cerebellar', target: 'gait' }
      ]
    },
    nephrology: {
      nodes: [
        { id: 'neph-px', label: 'Renal Exam', type: 'category' },
        { id: 'fluid-assess', label: 'Fluid Assessment', type: 'topic' },
        { id: 'edema', label: 'Edema Grading', type: 'topic' },
        { id: 'renal-biopsy', label: 'Biopsy Indications', type: 'topic' },
        { id: 'dialysis-access', label: 'Dialysis Access', type: 'topic' },
        { id: 'urine-exam', label: 'Urine Examination', type: 'topic' },
        { id: 'bp-renal', label: 'BP in Renal Disease', type: 'topic' }
      ],
      links: [
        { source: 'neph-px', target: 'fluid-assess' },
        { source: 'neph-px', target: 'edema' },
        { source: 'neph-px', target: 'renal-biopsy' },
        { source: 'neph-px', target: 'dialysis-access' },
        { source: 'neph-px', target: 'urine-exam' },
        { source: 'neph-px', target: 'bp-renal' },
        { source: 'fluid-assess', target: 'edema' }
      ]
    },
    endocrinology: {
      nodes: [
        { id: 'endo-px', label: 'Endocrine Exam', type: 'category' },
        { id: 'thyroid-exam', label: 'Thyroid Examination', type: 'topic' },
        { id: 'diabetic-foot', label: 'Diabetic Foot Exam', type: 'topic' },
        { id: 'cushing', label: 'Cushing Stigmata', type: 'topic' },
        { id: 'acromegaly', label: 'Acromegaly Signs', type: 'topic' },
        { id: 'addison', label: 'Addison Signs', type: 'topic' },
        { id: 'graves', label: 'Graves Eye Signs', type: 'topic' }
      ],
      links: [
        { source: 'endo-px', target: 'thyroid-exam' },
        { source: 'endo-px', target: 'diabetic-foot' },
        { source: 'endo-px', target: 'cushing' },
        { source: 'endo-px', target: 'acromegaly' },
        { source: 'endo-px', target: 'addison' },
        { source: 'endo-px', target: 'graves' },
        { source: 'thyroid-exam', target: 'graves' }
      ]
    },
    hematology: {
      nodes: [
        { id: 'heme-px', label: 'Hematology Exam', type: 'category' },
        { id: 'lymph-node', label: 'Lymph Node Exam', type: 'topic' },
        { id: 'spleen-exam', label: 'Spleen Palpation', type: 'topic' },
        { id: 'bleeding-assess', label: 'Bleeding Assessment', type: 'topic' },
        { id: 'pallor', label: 'Pallor & Anemia Signs', type: 'topic' },
        { id: 'blood-smear', label: 'Peripheral Smear', type: 'topic' },
        { id: 'bruising', label: 'Bruising Patterns', type: 'topic' }
      ],
      links: [
        { source: 'heme-px', target: 'lymph-node' },
        { source: 'heme-px', target: 'spleen-exam' },
        { source: 'heme-px', target: 'bleeding-assess' },
        { source: 'heme-px', target: 'pallor' },
        { source: 'heme-px', target: 'blood-smear' },
        { source: 'heme-px', target: 'bruising' },
        { source: 'bleeding-assess', target: 'bruising' }
      ]
    },
    id: {
      nodes: [
        { id: 'id-px', label: 'ID Clinical Exam', type: 'category' },
        { id: 'eschar', label: 'Eschar Search', type: 'topic', url: 'id-dashboard.html' },
        { id: 'conj-suff', label: 'Conjunctival Suffusion', type: 'topic', url: 'id-dashboard.html' },
        { id: 'lymph-patterns', label: 'Lymphadenopathy', type: 'topic', url: 'id-dashboard.html' },
        { id: 'rash-id', label: 'Rash Identification', type: 'topic', url: 'id-dashboard.html' },
        { id: 'fever-pattern', label: 'Fever Patterns', type: 'topic', url: 'id-dashboard.html' },
        { id: 'hepatosplen', label: 'Hepatosplenomegaly', type: 'topic', url: 'id-dashboard.html' }
      ],
      links: [
        { source: 'id-px', target: 'eschar' },
        { source: 'id-px', target: 'conj-suff' },
        { source: 'id-px', target: 'lymph-patterns' },
        { source: 'id-px', target: 'rash-id' },
        { source: 'id-px', target: 'fever-pattern' },
        { source: 'id-px', target: 'hepatosplen' },
        { source: 'fever-pattern', target: 'rash-id' }
      ]
    }
  };
})();
