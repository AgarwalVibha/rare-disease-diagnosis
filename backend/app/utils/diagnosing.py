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

    # score using Phrank algorithm
    ranked_diseases = phrank_score(phenotype_list, disease_to_hpo, ancestor_dict, top_n=3)

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

def phrank_score(query_terms, disease_to_hpo, ancestor_dict, top_n=3):
    """
    Computes Phrank scores using rank-based disease similarity.
    Instead of using absolute scores, diseases are **ranked** by their similarity to the query.

    - Diseases with **more overlapping phenotypes** rank **higher**.
    """
    disease_ranks = {}

    # Expand query terms
    expanded_query = expand_query_terms(query_terms, ancestor_dict)

    # Compute disease rankings based on phenotype overlap
    for disease, hpo_terms in disease_to_hpo.items():
        expanded_disease_terms = expand_query_terms(hpo_terms, ancestor_dict)

        # Count shared terms
        shared_terms = expanded_query.intersection(expanded_disease_terms)

        # Score is the count of shared terms
        disease_ranks[disease] = len(shared_terms)

    # Sort diseases by rank score (higher is better)
    ranked_diseases = sorted(disease_ranks.items(), key=lambda x: x[1], reverse=True)

    return ranked_diseases[:top_n]
