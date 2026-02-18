"""
Extract all PRACTICE items from by_topics .txt files and generate
a JSON data structure for the D3.js dependency graph.
"""
import os, re, json

TOPIC_DIR = os.path.dirname(os.path.abspath(__file__))

# Topic metadata: number → (name, tier)
# Tiers: 0=Foundation, 1=Core, 2=Bridge, 3=Advanced, 4=Capstone
TOPICS = {
    1:  ("Counting & Number Sense", 0),
    2:  ("Addition", 0),
    3:  ("Subtraction", 0),
    4:  ("Place Value & Decimals", 0),
    5:  ("Multiplication", 1),
    6:  ("Division", 1),
    7:  ("Fractions", 1),
    8:  ("Measurement, Money & Time", 1),
    9:  ("Geometry", 2),
    10: ("Data & Graphs", 2),
    11: ("Ratios, Rates & Proportions", 2),
    12: ("Exponents & Radicals", 3),
    13: ("Negative Numbers", 3),
    14: ("Patterns & Sequences", 3),
    15: ("Algebra & Equations", 3),
    16: ("Functions", 3),
    17: ("Trigonometry", 4),
    18: ("Statistics & Probability", 4),
    19: ("Calculus", 4),
}

TIER_COLORS = {
    0: "#4ade80",  # Foundation - green
    1: "#38bdf8",  # Core - blue
    2: "#a78bfa",  # Bridge - purple
    3: "#f97316",  # Advanced - orange
    4: "#f43f5e",  # Capstone - red
}

TIER_NAMES = {
    0: "Foundation",
    1: "Core",
    2: "Bridge",
    3: "Advanced",
    4: "Capstone",
}

# Grade/course ordering for X-axis positioning
GRADE_ORDER = {
    "Kindergarten": 0, "K": 0,
    "Grade 1": 1, "G1": 1,
    "Grade 2": 2, "G2": 2,
    "Grade 3": 3, "G3": 3,
    "Grade 4": 4, "G4": 4,
    "Grade 5": 5, "G5": 5,
    "Grade 6": 6, "G6": 6,
    "Grade 7": 7, "G7": 7,
    "Grade 8": 8, "G8": 8,
    "Pre-Algebra": 9, "PreAlg": 9, "PRE-ALGEBRA": 9,
    "Arithmetic": 9.5, "ARITHMETIC": 9.5,
    "Algebra 1": 10, "Alg1": 10, "ALGEBRA 1": 10,
    "High School Geometry": 11, "HS Geometry": 11, "HSGeo": 11,
    "Basic Geometry": 11.5, "BasicGeo": 11.5, "BASIC GEOMETRY": 11.5,
    "Algebra 2": 12, "Alg2": 12, "ALGEBRA 2": 12,
    "Precalculus": 13, "Precalc": 13, "PRECALCULUS": 13,
    "College Algebra": 13.5, "ColAlg": 13.5, "COLLEGE ALGEBRA": 13.5,
    "Trigonometry Course": 13.5, "TrigCourse": 13.5, "TRIGONOMETRY COURSE": 13.5,
    "Statistics Course": 14, "Stats": 14, "STATISTICS COURSE": 14,
    "AP Calculus AB": 14, "APCalcAB": 14, "AP CALCULUS AB": 14,
    "Calculus 1": 14, "Calc1": 14, "CALCULUS 1": 14,
    "AP Statistics": 15, "APStats": 15, "AP STATISTICS": 15,
    "AP Calculus BC": 14.5, "APCalcBC": 14.5, "AP CALCULUS BC": 14.5,
    "Calculus 2": 15, "Calc2": 15, "CALCULUS 2": 15,
    "Calculus 3": 16, "Calc3": 16, "CALCULUS 3": 16,
}

# Grade display labels
GRADE_LABELS = {
    0: "K", 1: "G1", 2: "G2", 3: "G3", 4: "G4", 5: "G5",
    6: "G6", 7: "G7", 8: "G8", 9: "Pre-Algebra", 9.5: "Arithmetic",
    10: "Algebra 1", 11: "HS Geometry", 11.5: "Basic Geometry",
    12: "Algebra 2", 13: "Precalculus", 13.5: "College Algebra",
    14: "Calc 1 / AP Calc AB / Stats", 14.5: "AP Calc BC",
    15: "Calc 2 / AP Stats", 16: "Calc 3",
}

# Grade header patterns to detect in .txt files
GRADE_PATTERNS = [
    (r'^KINDERGARTEN\b', 0),
    (r'^GRADE\s+1\b', 1),
    (r'^GRADE\s+2\b', 2),
    (r'^GRADE\s+3\b', 3),
    (r'^GRADE\s+4\b', 4),
    (r'^GRADE\s+5\b', 5),
    (r'^GRADE\s+6\b', 6),
    (r'^GRADE\s+7\b', 7),
    (r'^GRADE\s+8\b', 8),
    (r'^PRE-ALGEBRA\b', 9),
    (r'^ARITHMETIC\s+COURSE\b', 9.5),
    (r'^ALGEBRA\s+1\b', 10),
    (r'^HIGH\s+SCHOOL\s+GEOMETRY\b', 11),
    (r'^BASIC\s+GEOMETRY\b', 11.5),
    (r'^ALGEBRA\s+2\b', 12),
    (r'^PRECALCULUS\b', 13),
    (r'^COLLEGE\s+ALGEBRA\b', 13.5),
    (r'^TRIGONOMETRY\s+COURSE\b', 13.5),
    (r'^STATISTICS\s+COURSE\b', 14),
    (r'^AP\s+CALCULUS\s+AB\b', 14),
    (r'^AP\s+STATISTICS\b', 15),
    (r'^AP\s+CALCULUS\s+BC\b', 14.5),
    (r'^CALCULUS\s+1\b', 14),
    (r'^CALCULUS\s+2\b', 15),
    (r'^CALCULUS\s+3\b', 16),
    # Special cases
    (r'^CALCULUS\s*\(trigonometry\b', 14),  # in trig file
]

# Cross-topic prerequisite links (from_topic, from_grade_order, to_topic, to_grade_order)
# "last practice of from_topic at from_grade" → "first practice of to_topic at to_grade"
CROSS_TOPIC_LINKS = [
    # Foundation → Foundation
    (1, 0, 2, 0),      # Counting K → Addition K
    (1, 0, 3, 0),      # Counting K → Subtraction K
    (1, 0, 4, 0),      # Counting K → Place Value K
    (1, 0, 14, 0),     # Counting K → Patterns K
    
    # Foundation → Core
    (2, 2, 5, 3),      # Addition G2 → Multiplication G3
    (3, 2, 5, 3),      # Subtraction G2 → Multiplication G3
    (4, 2, 5, 3),      # Place Value G2 → Multiplication G3
    (5, 3, 6, 3),      # Multiplication G3 → Division G3
    (5, 3, 7, 3),      # Multiplication G3 → Fractions G3
    (2, 0, 8, 0),      # Addition K → Measurement K
    
    # Core → Bridge
    (8, 3, 9, 3),      # Measurement G3 → Geometry G3
    (6, 5, 11, 6),     # Division G5 → Ratios G6
    (7, 5, 11, 6),     # Fractions G5 → Ratios G6
    (10, 7, 18, 7),    # Data G7+ → Statistics G7
    
    # Core → Advanced
    (5, 5, 12, 5),     # Multiplication G5 → Exponents G5
    (7, 6, 13, 6),     # Fractions G6 → Negative Numbers G6
    (11, 7, 15, 7),    # Ratios G7 → Algebra G7
    (12, 8, 15, 8),    # Exponents G8 → Algebra G8
    (13, 7, 15, 7),    # Negative Numbers G7 → Algebra G7
    (14, 5, 15, 5),    # Patterns G5 → Algebra G5
    (9, 8, 15, 8),     # Geometry G8 → Algebra G8 (coordinate)
    
    # Advanced → Advanced
    (15, 8, 16, 8),    # Algebra G8 → Functions G8
    
    # Advanced → Capstone
    (9, 11, 17, 11),   # Geometry HSGeo → Trigonometry HSGeo
    (16, 13, 17, 13),  # Functions Precalc → Trig Precalc
    (16, 13, 19, 13),  # Functions Precalc → Calculus Precalc
    (17, 13, 19, 14),  # Trig Precalc → Calculus Calc1
]


def detect_grade(line):
    """Try to detect a grade/course header in a line."""
    stripped = line.strip()
    for pattern, grade_order in GRADE_PATTERNS:
        if re.match(pattern, stripped, re.IGNORECASE):
            return grade_order
    return None


def get_grade_label(grade_order):
    """Get a short label for a grade order number."""
    labels = {
        0: "K", 1: "G1", 2: "G2", 3: "G3", 4: "G4", 5: "G5",
        6: "G6", 7: "G7", 8: "G8", 9: "Pre-Alg", 9.5: "Arith",
        10: "Alg 1", 11: "HS Geo", 11.5: "Basic Geo",
        12: "Alg 2", 13: "Precalc", 13.5: "Col Alg",
        14: "Calc 1", 14.5: "AP Calc BC",
        15: "Calc 2", 16: "Calc 3",
    }
    return labels.get(grade_order, f"L{grade_order}")


def extract_practices_from_file(filepath, topic_num):
    """Extract all PRACTICE items from a topic file."""
    practices = []
    current_grade = None
    current_unit = ""
    
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    for line in lines:
        stripped = line.strip()
        
        # Skip empty lines and separators
        if not stripped or stripped.startswith('────') or stripped.startswith('═══'):
            continue
        
        # Check for grade/course headers
        grade = detect_grade(stripped)
        if grade is not None:
            current_grade = grade
            current_unit = ""
            continue
        
        # Check for "Calculus (trigonometry applications)" special case in topic 17
        if topic_num == 17 and re.match(r'^CALCULUS\b', stripped, re.IGNORECASE):
            current_grade = 14
            current_unit = ""
            continue
        
        # Check for unit headers
        unit_match = re.match(r'^Unit\s+(\d+)', stripped)
        if unit_match:
            # Extract unit name if present after ":"
            colon_pos = stripped.find(':')
            if colon_pos != -1:
                current_unit = stripped[colon_pos+1:].strip()
            else:
                current_unit = f"Unit {unit_match.group(1)}"
            continue
        
        # Check for "From Calculus 1:" / "From Calculus 2:" in trig file
        if topic_num == 17:
            calc1_match = re.match(r'^From Calculus 1:', stripped)
            calc2_match = re.match(r'^From Calculus 2:', stripped)
            if calc1_match:
                current_grade = 14
                continue
            if calc2_match:
                current_grade = 15
                continue
        
        # Check for "Supplemental from" headers in calculus file
        if re.match(r'^Supplemental from', stripped, re.IGNORECASE):
            # Keep current grade (Calc 3 level)
            continue
        
        # Extract PRACTICE items
        practice_match = re.match(r'^\d*\.?\s*PRACTICE:\s*(.+)', stripped)
        if practice_match and current_grade is not None:
            practice_name = practice_match.group(1).strip()
            practices.append({
                'name': practice_name,
                'grade': current_grade,
                'unit': current_unit,
            })
    
    return practices


def build_graph_data():
    """Build the complete graph data structure."""
    all_nodes = []
    all_links = []
    
    # Track practices by (topic, grade) for link generation
    topic_grade_practices = {}  # (topic_num, grade_order) → [node_ids]
    topic_practices = {}  # topic_num → [node_ids ordered by grade]
    
    node_id_counter = 0
    
    # Process each topic file
    for topic_num in sorted(TOPICS.keys()):
        topic_name, tier = TOPICS[topic_num]
        color = TIER_COLORS[tier]
        tier_name = TIER_NAMES[tier]
        
        # Find the file
        prefix = f"{topic_num:02d}_"
        filename = None
        for f in os.listdir(TOPIC_DIR):
            if f.startswith(prefix) and f.endswith('.txt'):
                filename = f
                break
        
        if not filename:
            print(f"  WARNING: No file found for topic {topic_num}")
            continue
        
        filepath = os.path.join(TOPIC_DIR, filename)
        practices = extract_practices_from_file(filepath, topic_num)
        
        print(f"  Topic {topic_num:02d}: {topic_name} — {len(practices)} practices")
        
        topic_node_ids = []
        
        for i, p in enumerate(practices):
            node_id = f"T{topic_num:02d}_{p['grade']}_{i}"
            node = {
                'id': node_id,
                'name': p['name'],
                'topic': topic_num,
                'topicName': topic_name,
                'grade': p['grade'],
                'gradeLabel': get_grade_label(p['grade']),
                'unit': p['unit'],
                'tier': tier,
                'tierName': tier_name,
                'color': color,
            }
            all_nodes.append(node)
            
            # Track by (topic, grade)
            key = (topic_num, p['grade'])
            if key not in topic_grade_practices:
                topic_grade_practices[key] = []
            topic_grade_practices[key].append(node_id)
            
            topic_node_ids.append((p['grade'], node_id))
            node_id_counter += 1
        
        topic_practices[topic_num] = topic_node_ids
    
    print(f"\n  Total nodes: {len(all_nodes)}")
    
    # Generate sequential links within each (topic, grade)
    for (topic_num, grade_order), node_ids in topic_grade_practices.items():
        for i in range(len(node_ids) - 1):
            all_links.append({
                'source': node_ids[i],
                'target': node_ids[i + 1],
                'type': 'sequential',
            })
    
    # Generate grade transition links within each topic
    for topic_num, node_list in topic_practices.items():
        # Group by grade
        grade_groups = {}
        for grade_order, node_id in node_list:
            if grade_order not in grade_groups:
                grade_groups[grade_order] = []
            grade_groups[grade_order].append(node_id)
        
        sorted_grades = sorted(grade_groups.keys())
        for i in range(len(sorted_grades) - 1):
            from_grade = sorted_grades[i]
            to_grade = sorted_grades[i + 1]
            # Last node of from_grade → first node of to_grade
            from_node = grade_groups[from_grade][-1]
            to_node = grade_groups[to_grade][0]
            all_links.append({
                'source': from_node,
                'target': to_node,
                'type': 'grade_transition',
            })
    
    # Generate cross-topic links
    for from_topic, from_grade, to_topic, to_grade in CROSS_TOPIC_LINKS:
        # Find the last practice of from_topic at or before from_grade
        from_key = (from_topic, from_grade)
        to_key = (to_topic, to_grade)
        
        if from_key in topic_grade_practices and to_key in topic_grade_practices:
            from_node = topic_grade_practices[from_key][-1]
            to_node = topic_grade_practices[to_key][0]
            all_links.append({
                'source': from_node,
                'target': to_node,
                'type': 'cross_topic',
            })
        else:
            # Try to find closest grade
            from_found = None
            to_found = None
            
            for (t, g), nodes in topic_grade_practices.items():
                if t == from_topic and g <= from_grade:
                    if from_found is None or g > from_found[0]:
                        from_found = (g, nodes[-1])
                if t == to_topic and g >= to_grade:
                    if to_found is None or g < to_found[0]:
                        to_found = (g, nodes[0])
            
            if from_found and to_found:
                all_links.append({
                    'source': from_found[1],
                    'target': to_found[1],
                    'type': 'cross_topic',
                })
    
    print(f"  Total links: {len(all_links)}")
    
    return {
        'nodes': all_nodes,
        'links': all_links,
        'topics': [
            {
                'num': num,
                'name': name,
                'tier': tier,
                'tierName': TIER_NAMES[tier],
                'color': TIER_COLORS[tier],
            }
            for num, (name, tier) in sorted(TOPICS.items())
        ],
        'grades': sorted(set(
            n['grade'] for n in all_nodes
        )),
    }


if __name__ == '__main__':
    print("Extracting practices from topic files...")
    data = build_graph_data()
    
    output_path = os.path.join(TOPIC_DIR, 'practices_data.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    
    print(f"\n  Output written to: {output_path}")
    print(f"  Nodes: {len(data['nodes'])}")
    print(f"  Links: {len(data['links'])}")
    print(f"  Topics: {len(data['topics'])}")
    print(f"  Grade levels: {len(data['grades'])}")
