from pronto import Ontology

def load_ontology(path_to_obo):
    """Load the ontology from an OBO file."""
    return Ontology(path_to_obo)

def precompute_ancestors(ontology):
    """Precomputes ancestor relationships for all ontology terms."""
    ancestor_dict = {}
    for term in ontology.terms():
        ancestor_dict[term.id] = {parent.id for parent in term.superclasses() if parent.id != term.id}
    return ancestor_dict
