import math
from collections import defaultdict

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
