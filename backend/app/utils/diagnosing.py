import math
from collections import defaultdict
from pronto import Ontology

def diagnose_helper(phenotype_list):
    # load data
    ontology_path = "/code/app/data/hp.obo" 
    hpo_annotations_path = "/code/app/data/phenotype.hpoa"
    ontology = load_ontology(ontology_path)
    
    # setup computational helpers
    disease_to_hpo, disease_to_genes, disease_to_name = read_disease_annotations(hpo_annotations_path)
    ancestor_dict = precompute_ancestors(ontology)
    g_phi = compute_g_phi(disease_to_hpo)
    g_pa_phi = compute_g_pa_phi(ancestor_dict, g_phi)

    # score using Phrank algorithm
    ranked_diseases = phrank_score(phenotype_list, disease_to_hpo, g_phi, g_pa_phi, ancestor_dict, top_n=5)

    # format diseases 
    diagnoses = [
        {
            "id": index + 1,
            "name": disease_to_name.get(disease, "Unknown Disease"),
            "probability": f"{(score / max(ranked_diseases, key=lambda x: x[1])[1]) * 100:.2f}%",
            "details": f"Ranked {index + 1} in Phrank analysis"
        }
        for index, (disease, score) in enumerate(ranked_diseases)
    ]
    return diagnoses


def load_ontology(path_to_obo):
    """Load the ontology from an OBO file."""
    return Ontology(path_to_obo)

def precompute_ancestors(ontology):
    """Precomputes ancestor relationships for all ontology terms."""
    ancestor_dict = {}
    for term in ontology.terms():
        ancestor_dict[term.id] = {parent.id for parent in term.superclasses() if parent.id != term.id}
    return ancestor_dict

def read_disease_annotations(hpo_disease_annotations):
    """Reads HPO disease annotations and maps diseases to associated HPO terms and genes."""
    disease_to_hpo = defaultdict(set)
    disease_to_genes = defaultdict(set)
    disease_to_name = {}

    with open(hpo_disease_annotations, 'r') as anno_handle:
        for line in anno_handle:
            if line.startswith('#'):
                continue  # Skip headers
            
            fields = line.strip().split('\t')
            if len(fields) < 5:
                continue  # Skip malformed lines

            disease_id, disease_name, gene_id, hpo_id = fields[:4]
            disease_to_hpo[disease_id].add(hpo_id)
            disease_to_genes[disease_id].add(gene_id)
            disease_to_name[disease_id] = disease_name

    return disease_to_hpo, disease_to_genes, disease_to_name


def expand_query_terms(query_terms, ancestor_dict):
    """Expand a set of query terms using precomputed ancestors."""
    expanded_terms = set(query_terms)
    for term in query_terms:
        expanded_terms.update(ancestor_dict.get(term, set()))
    return expanded_terms

def compute_g_phi(disease_to_hpo):
    """Compute G_phi (number of diseases annotated with each phenotype)."""
    g_phi = defaultdict(int)
    for hpo_terms in disease_to_hpo.values():
        for term in hpo_terms:
            g_phi[term] += 1
    return g_phi

def compute_g_pa_phi(ancestor_dict, g_phi):
    """Compute G_pa_phi (number of diseases annotated with the parent term of each phenotype)."""
    g_pa_phi = defaultdict(int)
    for term, count in g_phi.items():
        parent_terms = ancestor_dict.get(term, set())
        for parent in parent_terms:
            g_pa_phi[parent] += count  # Sum counts from child terms
    return g_pa_phi

def phrank_score(query_terms, disease_to_hpo, g_phi, g_pa_phi, ancestor_dict, top_n=5):
    """Compute Phrank scores using precomputed ancestors."""
    scores = {}

    # Compute expanded query terms once
    expanded_query = expand_query_terms(query_terms, ancestor_dict)

    # Precompute expanded terms for diseases
    disease_expansions = {disease: expand_query_terms(hpo_terms, ancestor_dict)
                          for disease, hpo_terms in disease_to_hpo.items()}

    for disease, expanded_disease in disease_expansions.items():
        common_ancestors = expanded_query.intersection(expanded_disease)

        score = 0
        for term in common_ancestors:
            g_term = g_phi.get(term, 1)
            g_parent = g_pa_phi.get(term, 1)

            if g_term > 0 and g_parent > 0:
                score += -math.log2(g_term / g_parent)

        scores[disease] = score

    # Sort and return only the top N diseases
    return sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_n]
