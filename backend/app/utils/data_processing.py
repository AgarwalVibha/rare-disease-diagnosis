from collections import defaultdict

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
